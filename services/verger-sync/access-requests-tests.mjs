import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import { openAuthorityDatabase } from "./authority-db.js";
import { createOrganization, createAccount } from "./consultations-service.js";
import { mountAuthorityApi } from "./authority-api.js";

test("access paths: verified domain, pending request, admin-only invitation and safe role", async () => {
  const db = openAuthorityDatabase(":memory:");
  createOrganization(db, {id:"orga",name:"ALDEBARAN"});
  createOrganization(db, {id:"orgb",name:"Autre association"});
  db.prepare("UPDATE organizations SET domain = ?, domain_verified_at = ? WHERE id = ?").run("asso-aldebaran.fr",new Date().toISOString(),"orga");
  db.prepare("UPDATE organizations SET domain = ?, domain_verified_at = ? WHERE id = ?").run("autre-association.fr",new Date().toISOString(),"orgb");
  createAccount(db,{organizationId:"orga",role:"administrator",email:"presidence@asso-aldebaran.fr",password:"une-phrase-longue-123"});
  createAccount(db,{organizationId:"orga",role:"facilitator",email:"bureau@asso-aldebaran.fr",password:"une-phrase-longue-123"});
  createAccount(db,{organizationId:"orgb",role:"administrator",email:"presidence@autre-association.fr",password:"une-phrase-longue-123"});
  createAccount(db, { organizationId: "orga", role: "administrator", email: "copresidence@example.test", password: "une-phrase-longue-123" });
  const emailDeliveries = [];
  const joinCode = db.prepare("SELECT join_code FROM organizations WHERE id = 'orga'").get().join_code;
  const app=express();
  mountAuthorityApi(app,{db,allowedOrigins:["https://app.lepotager.org"],nativeOrigins:["https://appassets.androidplatform.net"],
    deliverMail: async mail => { emailDeliveries.push(mail); },
  });
  const server=app.listen(0,"127.0.0.1");
  await new Promise(resolve=>server.once("listening",resolve));
  const url="http://127.0.0.1:"+server.address().port+"/api/v1";
  const request=async(path,{method="GET",body,token,origin="https://appassets.androidplatform.net"}={})=>{
    const headers={Origin:origin};
    if(body!==undefined)headers["Content-Type"]="application/json";
    if(token)headers.Authorization="Bearer "+token;
    const response=await fetch(url+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
    return {status:response.status,data:await response.json()};
  };
  const login=async(id,email)=>(await request("/native/login",{method:"POST",body:{organizationId:id,email,password:"une-phrase-longue-123"}})).data.sessionToken;
  try{
    assert.equal((await request("/organizations/by-domain/asso-aldebaran.fr")).data.organization.id,"orga");
    assert.equal((await request("/organizations/by-domain/unlisted.fr")).status,404);
    const payload={joinCode,email:"test@asso-aldebaran.fr",role:"facilitator",message:"Membre du bureau"};
    assert.equal((await request("/access-requests",{method:"POST",body:payload,origin:"https://evil.test"})).status,403);
    assert.equal((await request("/access-requests",{method:"POST",body:{...payload,role:"administrator"}})).status,400);
    assert.equal((await request("/access-requests",{method:"POST",body:payload})).status,202);
    assert.equal((await request("/access-requests",{method:"POST",body:payload})).status,202);
    assert.equal(Number(db.prepare("SELECT COUNT(*) as n FROM access_requests WHERE organization_id = 'orga'").get().n),1);
    assert.equal((await request("/access-requests", { method: "POST", body: { ...payload, joinCode: "invalid" } })).status, 400);
    assert.deepEqual(emailDeliveries.map(mail => mail.email).sort(), ["copresidence@example.test", "presidence@asso-aldebaran.fr"]);
    const unregistered=await request("/access-requests",{method:"POST",body:{domain:"unlisted.fr",email:"test@example.org",role:"member"}});
    assert.equal(unregistered.status,202);
    assert.deepEqual(unregistered.data,{accepted:true});
    assert.equal((await request("/access-requests")).status,401);
    const bureauToken=await login("orga","bureau@asso-aldebaran.fr");
    assert.equal((await request("/access-requests",{token:bureauToken})).status,403);
    const foreignToken=await login("orgb","presidence@autre-association.fr");
    assert.deepEqual((await request("/access-requests",{token:foreignToken})).data.requests,[]);
    const presidentToken=await login("orga","presidence@asso-aldebaran.fr");
    const firstSession = await request("/session", { token: presidentToken });
    assert.equal(firstSession.data.organization.joinCode, joinCode);
    const logoDataUrl = "data:image/webp;base64,UklGRg==";
    assert.equal((await request("/organization/logo", { method: "PATCH", token: bureauToken, body: { logoDataUrl } })).status, 403);
    assert.equal((await request("/organization/logo", { method: "PATCH", token: presidentToken, body: { logoDataUrl } })).status, 200);
    assert.equal((await request("/session", { token: foreignToken })).data.organization.logoDataUrl, null);
    const listed=await request("/access-requests",{token:presidentToken});
    assert.equal(listed.status,200);
    assert.equal(listed.data.requests.length,1);
    const id=listed.data.requests[0].id;
    assert.equal((await request("/access-requests/"+id+"/approve",{method:"POST",body:{},token:bureauToken})).status,403);
    assert.equal((await request("/access-requests/"+id+"/approve",{method:"POST",body:{},token:foreignToken})).status,404);
    const approved=await request("/access-requests/"+id+"/approve",{method:"POST",body:{},token:presidentToken});
    assert.equal(approved.status,200);
    assert.equal(approved.data.role,"facilitator");
    assert.ok(approved.data.invitation.token);
    assert.equal((await request("/access-requests/"+id+"/approve",{method:"POST",body:{},token:presidentToken})).status,404);
    assert.equal(approved.data.emailed, true);
    assert.equal(emailDeliveries.at(-1).email, payload.email);
    assert.ok(emailDeliveries.at(-1).text.includes(approved.data.invitation.token));
    const openInvitation = body => request("/native/invitations/accept", { method: "POST", body });
    const token = approved.data.invitation.token;
    assert.equal((await openInvitation({ token, organizationId: "orgb" })).status, 409);
    const invited = await openInvitation({ token });
    assert.equal(invited.status, 201);
    assert.equal(invited.data.account.role, "facilitator");
    assert.equal(invited.data.account.organizationId, "orga");
    assert.equal(invited.data.account.needsPassword, true);
    assert.equal(invited.data.organization.logoDataUrl, logoDataUrl);
    assert.equal(invited.data.organization.joinCode, undefined);
    assert.equal((await openInvitation({ token })).status, 404);
    const profile = await request("/account/profile", {
      method: "PATCH", token: invited.data.sessionToken,
      body: { displayName: "Nouveau membre", password: "une-phrase-longue-123", role: "administrator" },
    });
    assert.equal(profile.status, 200);
    assert.equal(profile.data.account.displayName, "Nouveau membre");
    assert.equal(profile.data.account.needsPassword, false);
    assert.equal(profile.data.account.role, "facilitator");
    assert.ok(await login("orga", payload.email));
    const manual = await request("/invitations", {
      method: "POST", token: presidentToken,
      body: { email: "lecteur@example.test", role: "reader", memberId: "local-123" },
    });
    assert.equal(manual.status, 201);
    assert.equal(emailDeliveries.at(-1).email, "lecteur@example.test");
    const reader = await openInvitation({ token: manual.data.token });
    assert.equal(reader.data.account.role, "reader");
    assert.equal(reader.data.account.memberId, "local-123");
    assert.deepEqual((await request("/access-requests",{token:presidentToken})).data.requests,[]);
    assert.deepEqual((await request("/access-requests",{token:foreignToken})).data.requests,[]);
  }finally{
    server.closeAllConnections();
    await new Promise(resolve=>server.close(resolve));
    db.close();
  }
});
