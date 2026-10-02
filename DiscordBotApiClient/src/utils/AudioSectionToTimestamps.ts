export type SectionTimestamp = {
  startHours: number;
  endHours: number;
  startMinutes: number;
  endMinutes: number;
  startSeconds: number;
  endSeconds: number;
  startMiliseconds: number;
  endMiliseconds: number;
};

interface Section {
  start: number;
  end: number;
}

function BrakeToTimeParts(totalSeconds: number) {
  const totalMs = Math.round(totalSeconds * 1000);
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1000);
  const miliseconds = totalMs % 1000;
  return { hours, minutes, seconds, miliseconds };
}

export function ConvertAudioSection(data: Section): SectionTimestamp {
  const startTimestamp = BrakeToTimeParts(data.start);
  const endTimestamp = BrakeToTimeParts(data.end);

  return {
    startHours: startTimestamp.hours,
    endHours: endTimestamp.hours,
    startMinutes: startTimestamp.minutes,
    endMinutes: endTimestamp.minutes,
    startSeconds: startTimestamp.seconds,
    endSeconds: endTimestamp.seconds,
    startMiliseconds: startTimestamp.miliseconds,
    endMiliseconds: endTimestamp.miliseconds,
  };
}
