"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShapeData = void 0;
class ShapeData {
    constructor(data) {
        this.division = data.division;
        this.district = data.district;
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
exports.ShapeData = ShapeData;
