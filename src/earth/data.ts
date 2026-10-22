export type EarthRecord={id:string;station:string;startTime:string;originTime:string;sfreq:number;durationS:number;unit:string;components:("E"|"N"|"Z")[];samples:Record<"E"|"N"|"Z",number[]>;pSample:number;sSample:number;pStatus:string;sStatus:string;magnitude:number;magnitudeType:string;eventLatitude:number;eventLongitude:number;stationLatitude:number;stationLongitude:number};
export type EarthDataset={origin:string;license:string;licenseUrl:string;citation:string;sourceRepository:string;sampleRepository:string;processing:string;source:{revision:string;files:Record<string,{url:string;sha256:string}>};records:EarthRecord[]};
export function validateEarthDataset(value:unknown):EarthDataset {
 const data=value as EarthDataset;
 if(!data || data.origin!=="STEAD" || !Array.isArray(data.records) || !data.records.length) throw Error("The earthquake sample bundle is invalid.");
 for(const r of data.records){
  if(!r || !Number.isFinite(r.sfreq) || r.sfreq<=0 || !Number.isInteger(r.pSample) || !Number.isInteger(r.sSample) || r.pSample<0 || r.sSample<=r.pSample || r.sSample>=r.sfreq*r.durationS || r.pStatus!=="manual" || r.sStatus!=="manual")throw Error("The earthquake arrival metadata is invalid.");
  for(const c of ["E","N","Z"] as const) if(!Array.isArray(r.samples?.[c]) || r.samples[c].length!==r.sfreq*r.durationS || !r.samples[c].every(Number.isFinite)) throw Error("The earthquake waveform is incomplete.");
 }
 return data;
}
export function arrivalGap(pSample:number,sSample:number,sfreq:number):number {
 if(!Number.isFinite(sfreq)||sfreq<=0||!Number.isFinite(pSample)||!Number.isFinite(sSample)||pSample<0||sSample<=pSample) throw Error("Choose a P arrival before the S arrival.");
 return (sSample-pSample)/sfreq;
}
