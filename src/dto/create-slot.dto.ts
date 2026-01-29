export class CreateSlotBody {
  doctorId!: string;
  slotDate!: string;      // YYYY-MM-DD
  startTime!: string;     // HH:mm
  endTime!: string;       // HH:mm
  hardCapacity!: number;
}
