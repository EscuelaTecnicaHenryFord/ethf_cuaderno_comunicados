import { readFile } from "fs/promises";
import { z } from "zod";
import { env } from "./env.mjs";
import path from 'path'

export const teacherSchema = z.object({
    name: z.string(),
    email: z.string().email(),
})

export const studentSchema = z.object({
    name: z.string(),
    enrolment: z.string(),
    motherEmail: z.string().optional(),
    fatherEmail: z.string().optional(),
    coursingYear: z.number().int().min(1).max(7),
})

export const subjectSchema = z.object({
    name: z.string(),
    code: z.string(),
    teachers: z.array(z.string()),
    courseYear: z.number().int().min(1).max(7),
})

export class Settings {
    /** @type {z.infer<typeof teacherSchema>[]} */
    teachers = [];
    /** @type {z.infer<typeof studentSchema>[]} */
    students = [];
    /** @type {z.infer<typeof subjectSchema>[]} */
    subjects = [];

    /** @type {Map<string, z.infer<typeof studentSchema>>} */
    _studentsByEnrolment = new Map();
    /** @type {Map<string, z.infer<typeof teacherSchema>>} */
    _teachersByEmail = new Map();
    /** @type {Map<string, z.infer<typeof subjectSchema>>} */
    _subjectsByCode = new Map();

    _dataImported = false;

    /** @param {number} year */
    async getStudentsOf(year) {
        await this._autoImport();
        return this.students.filter(student => student.coursingYear === year);
    }

    /** @param {string} subjectCode */
    async getTeachersOf(subjectCode) {
        await this._autoImport();
        const subject = this._subjectsByCode.get(subjectCode);

        /** @type {Array<z.infer<typeof teacherSchema>>} */
        const result = []
        if(subject) {
            for(const email of subject.teachers) {
                const teacher = this._teachersByEmail.get(email);
                if(teacher) {
                    result.push(teacher);
                }
            }
        }
        return result;
    }

    /** @param {number} year */
    async getSubjectsOfYear(year) {
        await this._autoImport();
        return this.subjects.filter(subject => subject.courseYear === year);
    }

    /** @param {string} email */
    async getSubjectsOfTeacher(email) {
        await this._autoImport();
        return this.subjects.filter(subject => subject.teachers.includes(email));
    }

    /** @param {string} enrolment */
    async getStudentByEnrolment(enrolment) {
        await this._autoImport();
        return this._studentsByEnrolment.get(enrolment);
    }

    async importData() {
        const importedTeachers = (await readFile(path.join(env.SETTINGS_PATH, 'teachers.json'), 'utf-8')).toString();
        const importedStudents = (await readFile(path.join(env.SETTINGS_PATH, 'students.json'), 'utf-8')).toString();
        const importedSubjects = (await readFile(path.join(env.SETTINGS_PATH, 'subjects.json'), 'utf-8')).toString();

        const result1 = await z.array(teacherSchema).safeParseAsync(importedTeachers);
        if (result1.success) {
            this.teachers = result1.data;
        } else {
            this._errorImporting();
        }

        const result2 = await z.array(studentSchema).safeParseAsync(importedStudents);
        if (result2.success) {
            this.students = result2.data;
        } else {
            this._errorImporting();
        }

        const result3 = await z.array(subjectSchema).safeParseAsync(importedSubjects);
        if (result3.success) {
            this.subjects = result3.data;
        } else {
            this._errorImporting();
        }

        this.students.forEach(student => this._studentsByEnrolment.set(student.enrolment, student));
        this.teachers.forEach(teacher => this._teachersByEmail.set(teacher.email, teacher));
        this.subjects.forEach(subject => this._subjectsByCode.set(subject.code, subject));

        this._dataImported = true
    }

    async _autoImport() {
        if (!this._dataImported) await this.importData();
    }

    _errorImporting() {
        throw new Error('Error importing data');
    }
}


export const settings = new Settings()