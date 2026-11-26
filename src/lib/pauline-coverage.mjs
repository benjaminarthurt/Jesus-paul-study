export function paulineCoverage(counts, passages) {
 return Object.entries(counts).map(([bookId, lengths]) => {
  const sets=lengths.map(()=>new Set());
  for(const p of passages.filter(p=>p.bookId===bookId)){
   const m=p.reference.match(/(\d+):(\d+)(?:[–-](?:(\d+):)?(\d+))?$/);
   if(!m) throw new Error("Unparseable reference: "+p.reference);
   const a=Number(m[1]), b=Number(m[3]||a), first=Number(m[2]), last=Number(m[4]||first);
   if(a<1||b<a||b>lengths.length||first<1||first>lengths[a-1]||last<1||last>lengths[b-1]||(a===b&&last<first)) throw new Error("Out of bounds: "+p.reference);
   for(let c=a;c<=b;c++) for(let v=c===a?first:1;v<=(c===b?last:lengths[c-1]);v++) sets[c-1].add(v);
  }
  const chapters=lengths.map((total,i)=>{
   const gaps=[];let start=0;
   for(let v=1;v<=total+1;v++){
    if(v<=total&&!sets[i].has(v)){if(!start)start=v;}
    else if(start){gaps.push({start,end:v-1});start=0;}
   }
   return {chapter:i+1,total,covered:sets[i].size,gaps};
  });
  return {bookId,chapters,total:chapters.reduce((s,c)=>s+c.total,0),covered:chapters.reduce((s,c)=>s+c.covered,0)};
 });
}
