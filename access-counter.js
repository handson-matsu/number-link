// Same endpoint/GET options as tangram and hexagon-tiling; configured in config.js.
// An opaque no-cors response cannot confirm that a row was written by GAS.
export function createAccessRecorder(send=globalThis.fetch,config=globalThis.NUMBERLINK_CONFIG) {
  let attempted=false;
  return function recordOnce() {
    if(attempted)return;
    attempted=true; // Including synchronous errors: never retry within this document.
    try {
      if(!config?.gasUrl)return;
      const url=new URL(config.gasUrl);
      url.searchParams.set('app','number-link');
      Promise.resolve(send(url.href,{
        method:'GET',mode:'no-cors',cache:'no-store',credentials:'omit',keepalive:true
      })).catch(()=>{});
    } catch {
      // Access logging must never interrupt gameplay.
    }
  };
}

// A module instance belongs to one document. Reloading creates a fresh recorder.
export const recordAccessOnce=createAccessRecorder();
