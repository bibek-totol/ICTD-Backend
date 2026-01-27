import { prisma } from "../configs/prisma.config";
import { AppError } from "../utils/AppError.util";
import { ShapeData, } from "../interfaces_and_types/labs.interface";
const mapLabToFrontend = (lab) => ({
    id: lab.id,
    institute: lab.institute,
    division: lab.division,
    upazila: lab.upazila,
    seat: lab.seat,
    head: lab.head,
    mobile: lab.mobile,
    altMobile: lab.alt_mobile,
    email: lab.email,
    labType: lab.lab_type,
    lat: lab.lat,
    long: lab.long,
});
export const getLabs = async (req, res) => {
    try {
        const { division, upazila, labType, search } = req.query;
        const whereClause = {};
        if (division && division !== "All") {
            whereClause.division = division;
        }
        if (upazila && upazila !== "All") {
            whereClause.upazila = upazila;
        }
        if (labType && labType !== "All") {
            whereClause.lab_type = labType;
        }
        if (search) {
            whereClause.OR = [
                { institute: { contains: search, mode: "insensitive" } },
                { head: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { division: { contains: search, mode: "insensitive" } },
            ];
        }
        const labs = await prisma.labs.findMany({
            where: whereClause,
            orderBy: {
                id: "asc",
            },
        });
        const mappedLabs = labs.map(mapLabToFrontend);
        return res.status(200).json({
            success: true,
            message: "Labs retrieved successfully",
            data: mappedLabs,
            count: mappedLabs.length,
        });
    }
    catch (error) {
        const errorObj = {
            fnc: "getLabs",
            error,
        };
        throw new AppError(errorObj);
    }
};
export const getLabById = async (req, res) => {
    try {
        const { id } = req.params;
        const lab = await prisma.labs.findUnique({
            where: {
                id: parseInt(id),
            },
        });
        if (!lab) {
            return res.status(404).json({
                success: false,
                message: "Lab not found",
            });
        }
        const mappedLab = mapLabToFrontend(lab);
        return res.status(200).json({
            success: true,
            message: "Lab retrieved successfully",
            data: mappedLab,
        });
    }
    catch (error) {
        const errorObj = {
            fnc: "getLabById",
            error,
        };
        throw new AppError(errorObj);
    }
};
export const getFilterOptions = async (req, res) => {
    try {
        const divisions = await prisma.labs.findMany({
            distinct: ["division"],
            select: {
                division: true,
            },
            where: {
                division: {
                    not: null,
                },
            },
            orderBy: {
                division: "asc",
            },
        });
        const upazilas = await prisma.labs.findMany({
            distinct: ["upazila"],
            select: {
                upazila: true,
            },
            where: {
                upazila: {
                    not: null,
                },
            },
            orderBy: {
                upazila: "asc",
            },
        });
        const labTypes = await prisma.labs.findMany({
            distinct: ["lab_type"],
            select: {
                lab_type: true,
            },
            where: {
                lab_type: {
                    not: null,
                },
            },
            orderBy: {
                lab_type: "asc",
            },
        });
        return res.status(200).json({
            success: true,
            message: "Filter options retrieved successfully",
            data: {
                divisions: divisions.map((d) => d.division).filter(Boolean),
                upazilas: upazilas.map((u) => u.upazila).filter(Boolean),
                labTypes: labTypes.map((l) => l.lab_type).filter(Boolean),
            },
        });
    }
    catch (error) {
        const errorObj = {
            fnc: "getFilterOptions",
            error,
        };
        throw new AppError(errorObj);
    }
};
export const newGetLabs = async (req, res) => {
    try {
        const labs = await prisma.labs.findMany({
            select: {
                id: true,
                division: true,
                seat: true,
                upazila: true,
                institute: true,
                lab_type: true,
                lat: true,
                long: true,
                user: {
                    select: {
                        userName: true,
                        email: true,
                        phoneNumber: true,
                        altPhoneNumber: true,
                    },
                },
            },
        });
        const outputData = [];
        for (let lab of labs) {
            outputData.push(new ShapeData(lab));
        }
        return res.status(200).json({
            success: true,
            message: "Labs retrieved successfully",
            data: outputData,
            count: outputData.length,
        });
    }
    catch (error) {
        const errorObj = {
            fnc: "newGetLabs",
            error,
        };
        throw new AppError(errorObj);
    }
};
