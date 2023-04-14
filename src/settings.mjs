import { readFile } from "fs/promises";
import { z } from "zod";
import { env } from "./env.mjs";
import path from 'path'

const minCourse = 1
const maxCourse = 7

export const generalSettingsSchema = z.object({
    messages: z.array(z.string()),
    admins: z.array(z.string()).optional().nullable(),
})

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
    courseYear: z.number().int().min(minCourse).max(maxCourse),
})

export class Settings {
    /** @type {z.infer<typeof teacherSchema>[]} */
    teachers = [];
    /** @type {z.infer<typeof studentSchema>[]} */
    students = [];
    /** @type {z.infer<typeof subjectSchema>[]} */
    subjects = [];
    /** @type {z.infer<typeof generalSettingsSchema>} */
    general = {
        messages: []
    }

    /** @type {Map<string, z.infer<typeof studentSchema>>} */
    _studentsByEnrolment = new Map();
    /** @type {Map<string, z.infer<typeof teacherSchema>>} */
    _teachersByEmail = new Map();
    /** @type {Map<string, z.infer<typeof subjectSchema>>} */
    _subjectsByCode = new Map();
    /** @type {Map<string, Set<string>>} */
    _subjectsByTeacher = new Map();

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
        if (subject) {
            for (const email of subject.teachers) {
                const teacher = this._teachersByEmail.get(email);
                if (teacher) {
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
        return this._studentsByEnrolment.get(enrolment.toLowerCase());
    }

    /** @param {string} email */
    async getSubjectsOf(email) {
        await this._autoImport();
        const list = [...(this._subjectsByTeacher.get(email) || new Set())].map(code => this._subjectsByCode.get(code))
        /** @type {Array<z.infer<typeof subjectSchema>>} */
        const result = []
        for (const subject of list) {
            if(!subject) continue
            result.push(subject);
        }
        return result
    }

    /** @param {string} code */
    async getSubject(code) {
        await this._autoImport();
        return this._subjectsByCode.get(code);
    }

    async getMessages() {
        await this._autoImport();
        return this.general.messages;
    }

    /** @param {string} email */
    async getTeacher(email) {
        await this._autoImport();
        return this._teachersByEmail.get(email);
    }

    async importData() {
        try {
            const importedTeachers = JSON.parse((await readFile(path.join(env.SETTINGS_PATH, 'teachers.json'), 'utf-8')).toString());
            const importedStudents = JSON.parse((await readFile(path.join(env.SETTINGS_PATH, 'students.json'), 'utf-8')).toString());
            const importedSubjects = JSON.parse((await readFile(path.join(env.SETTINGS_PATH, 'subjects.json'), 'utf-8')).toString());
            const importedGeneral = JSON.parse((await readFile(path.join(env.SETTINGS_PATH, 'general.json'), 'utf-8')).toString());

            this.teachers = await z.array(teacherSchema).parseAsync(importedTeachers);

            this.students = await z.array(studentSchema).parseAsync(importedStudents);

            this.subjects = await z.array(subjectSchema).parseAsync(importedSubjects);

            this.general = await generalSettingsSchema.parseAsync(importedGeneral);
        } catch (error) {
            console.error("Error importing data", error);
            throw new Error('Error importing data');
        }


        this.students.forEach(student => this._studentsByEnrolment.set(student.enrolment.toLowerCase(), student));
        this.teachers.forEach(teacher => this._teachersByEmail.set(teacher.email, teacher));
        this.subjects.forEach(subject => this._subjectsByCode.set(subject.code, subject));

        for (const subject of this.subjects) {
            for (const teacherEmail of subject.teachers) {
                const teacherSubjects = this._subjectsByTeacher.get(teacherEmail) || new Set();
                teacherSubjects.add(subject.code);
                this._subjectsByTeacher.set(teacherEmail, teacherSubjects);
            }
        }

        this._dataImported = true
    }

    getCourses() {
        const courses = []
        for (let i = minCourse; i <= maxCourse; i++) {
            courses.push({
                year: i,
                get label() {
                    return `${i}° año`
                }
            })
        }
        return courses
    }

    /** @param {string} email */
    async getUserRole(email) {
        await this._autoImport();
        const teacher = this._teachersByEmail.get(email);
        const isAdmin = this.general.admins?.includes(email);
        return {
            isAdmin,
            isTeacher: !!teacher,
        }
    }

    async _autoImport() {
        if (!this._dataImported) await this.importData();
    }

    _errorImporting() {
        throw new Error('Error importing data');
    }
}


export const settings = new Settings()