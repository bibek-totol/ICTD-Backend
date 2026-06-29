import { Request, Response } from 'express';
import { AppError } from '../utils/AppError.util';
import { AppErrorPayload } from '../interfaces_and_types/AppError.interface';

// Static imports to make sure TypeScript bundles/copies the JSONs to dist/data/
import bdDivisions from '../data/bd-divisions.json';
import bdDistricts from '../data/bd-districts.json';
import bdUpazilas from '../data/bd-upazilas.json';
import srdData from '../data/srd-data.json';
import srdData300 from '../data/srd-data300.json';

export const getDivisions = async (req: Request, res: Response) => {
  try {
    res.status(200).json(bdDivisions);
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: 'getDivisions', error };
    throw new AppError(errorObj);
  }
};

export const getDistricts = async (req: Request, res: Response) => {
  try {
    res.status(200).json(bdDistricts);
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: 'getDistricts', error };
    throw new AppError(errorObj);
  }
};

export const getUpazilas = async (req: Request, res: Response) => {
  try {
    res.status(200).json(bdUpazilas);
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: 'getUpazilas', error };
    throw new AppError(errorObj);
  }
};

export const getSrdData = async (req: Request, res: Response) => {
  try {
    res.status(200).json(srdData);
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: 'getSrdData', error };
    throw new AppError(errorObj);
  }
};

export const getSrdData300 = async (req: Request, res: Response) => {
  try {
    res.status(200).json(srdData300);
  } catch (error) {
    const errorObj: AppErrorPayload = { fnc: 'getSrdData300', error };
    throw new AppError(errorObj);
  }
};
