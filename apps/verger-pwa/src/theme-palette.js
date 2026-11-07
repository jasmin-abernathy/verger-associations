/** Subtle organization palette derived from a single user-selected hue. */
export const DEFAULT_ASSOCIATION_COLOR = "#315f3a";
function rgb(color) {
  if (!/^#[a-f\d]{6}$/i.test(String(color))) throw new Error("Invalid hex color");
  return [1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
}
function hex(values) {
  return "#"+values.map(n=>Math.min(255,Math.max(0,Math.round(n))).toString(16).padStart(2,"0")).join("");
}
function blend(left,right,ratio) {
  const a=rgb(left),b=rgb(right);
  return hex(a.map((n,i)=>n*(1-ratio)+b[i]*ratio));
}
function luminance(color) {
  const [r,g,b]=rgb(color).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return .2126*r+.7152*g+.0722*b;
}
export function contrastRatio(a,b) {
  const x=luminance(a),y=luminance(b);
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
function readable(color,background,threshold,toward) {
  if(contrastRatio(color,background)>=threshold)return color;
  let low=0,high=1;
  for(let k=0;k<17;k++){
    const mid=(low+high)/2;
    if(contrastRatio(blend(color,toward,mid),background)>=threshold)high=mid;
    else low=mid;
  }
  return blend(color,toward,high);
}
export function associationPalette(chosen=DEFAULT_ASSOCIATION_COLOR,dark=false) {
  const color=/^#[a-f\d]{6}$/i.test(String(chosen))?chosen.toLowerCase():DEFAULT_ASSOCIATION_COLOR;
  const background=dark?blend("#131b1d",color,.055):blend(color,"#ffffff",.954);
  const surface=dark?blend("#222b2d",color,.09):blend(color,"#ffffff",.982);
  const surface2=dark?blend("#303c3e",color,.13):blend(color,"#ffffff",.895);
  return {
    "--bg":background,
    "--surface":surface,
    "--surface-2":surface2,
    "--border":dark?blend("#657277",color,.16):blend(color,"#ffffff",.72),
    "--green":readable(color,"#ffffff",4.6,"#000000"),
    "--green-strong":readable(color,surface2,5,dark?"#ffffff":"#000000"),
    "--green-soft":dark?blend(background,color,.20):blend(color,"#ffffff",.82),
    "--button-text":"#ffffff",
  };
}
export function applyAssociationPalette(root,color,dark){
  const result=associationPalette(color,dark);
  for(const [key,value] of Object.entries(result))root.style.setProperty(key,value);
  return result;
}
