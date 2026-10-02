import type Timestamp from "./Timestamp";

export default interface BeginAudioExtractionPostDto {
  url: string;
  startsAt: Timestamp;
  endsAt: Timestamp;
}
