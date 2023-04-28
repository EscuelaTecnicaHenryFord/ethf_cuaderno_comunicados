import { readFile, writeFile } from "fs/promises";
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

    async getAllStudents() {
        await this._autoImport();
        return this.students;
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

    async getAllSubjects() {
        await this._autoImport();
        return this.subjects;
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
            if (!subject) continue
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
            const importedTeachers = JSON.parse(await this.getFile('teachers.json'));
            const importedStudents = JSON.parse(await this.getFile('students.json'));
            const importedSubjects = JSON.parse(await this.getFile('subjects.json'));
            const importedGeneral = JSON.parse(await this.getFile('general.json'));

            const teachers = await z.array(teacherSchema).parseAsync(importedTeachers);

            const students = await z.array(studentSchema).parseAsync(importedStudents);

            const subjects = await z.array(subjectSchema).parseAsync(importedSubjects);

            const general = await generalSettingsSchema.parseAsync(importedGeneral);

            this.reset()

            this.teachers = teachers;
            this.students = students;
            this.subjects = subjects;
            this.general = general;
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

    async getTeachers() {
        await this._autoImport();
        return this.teachers;
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
        if (!this._dataImported || env.NODE_ENV === 'development') await this.importData();
    }

    _errorImporting() {
        throw new Error('Error importing data');
    }

    reset() {
        this.teachers = [];
        this.students = [];
        this.subjects = [];
        this.general = {
            messages: []
        };

        this._studentsByEnrolment = new Map();
        this._teachersByEmail = new Map();
        this._subjectsByCode = new Map();
        this._subjectsByTeacher = new Map();

        this._dataImported = false;
    }

    /** @param {string} name */
    async getFile(name) {
        return (await readFile(path.join(env.SETTINGS_PATH, name), 'utf-8')).toString()
    }

    /**
     * @param {string} name 
     * @param {string} data 
    */
    async saveFile(name, data) {
        const names = [
            'teachers.json',
            'students.json',
            'subjects.json',
            'general.json',
        ]

        if(!names.includes(name)) throw new Error('Invalid file name')

        await writeFile(path.join(env.SETTINGS_PATH, name), data)
    }
}


export const settings = new Settings()