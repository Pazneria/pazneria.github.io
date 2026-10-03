(function(root){
  'use strict';
  function createRecords(storage){
    const memory=new Map();let persistent=Boolean(storage);
    function key(difficulty){if(!['easy','normal','hard'].includes(difficulty))throw new RangeError('Unknown difficulty');return 'rebound-relay:clean-shot-v1:best:'+difficulty;}
    function best(difficulty){
      const name=key(difficulty);let value=memory.get(name)||0;
      if(persistent)try{const raw=storage.getItem(name);if(raw!==null&&/^\d{1,9}$/.test(raw))value=Math.max(value,Number(raw));}catch{persistent=false;}
      memory.set(name,value);return value;
    }
    function record(difficulty,score){
      if(!Number.isSafeInteger(score)||score<0||score>999999999)throw new RangeError('Invalid score');
      const previous=best(difficulty),value=Math.max(previous,score);memory.set(key(difficulty),value);
      if(persistent)try{storage.setItem(key(difficulty),String(value));}catch{persistent=false;}
      return {best:value,isNew:score>previous,persistent};
    }
    return {best,record,get persistent(){return persistent;}};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={createRecords};else root.ReboundRecords={createRecords};
})(globalThis);
