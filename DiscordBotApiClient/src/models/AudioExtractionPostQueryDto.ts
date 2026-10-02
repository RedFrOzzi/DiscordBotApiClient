import type Timestamp from "./Timestamp";

export default interface AudioExtractionPostQueryDto {
  url: string;
  startsAt: Timestamp;
  endsAt: Timestamp;
}
