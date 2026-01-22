import { LabTypes } from "@prisma/client";

export interface NestedUser {
  userName: string | null;
  phoneNumber: string | null;
  altPhoneNumber: string | null;
  email: string;
}

export interface OutputStructure {
  id: number;
  division: string | null;
  seat: string | null;
  upazila: string | null;
  institute: string | null;
  lab_type: LabTypes | null;
  lat: string | null;
  long: string | null;
  user: NestedUser;
}

export class ShapeData {
  division: string | null;
  seat: string | null;
  upazila: string | null;
  id: number;
  institute: string | null;
  lab_type: LabTypes | null;
  head: string | null;
  mobile: string | null;
  alt_mobile: string | null;
  email: string;
  lat: string | null;
  long: string | null;

  constructor(data: OutputStructure) {
    this.division = data.division;
    this.seat = data.seat;
    this.upazila = data.upazila;
    this.id = data.id;
    this.institute = data.institute;
    this.lab_type = data.lab_type;

    this.head = data.user.userName;
    this.mobile = data.user.phoneNumber;
    this.alt_mobile = data.user.altPhoneNumber;
    this.email = data.user.email;

    this.lat = data.lat;
    this.long = data.long;
  }
}
