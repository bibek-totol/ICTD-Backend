export class ShapeData {
    division;
    seat;
    upazila;
    id;
    institute;
    lab_type;
    head;
    mobile;
    alt_mobile;
    email;
    lat;
    long;
    constructor(data) {
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
