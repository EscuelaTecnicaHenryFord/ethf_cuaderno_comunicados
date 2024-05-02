import { readFile, writeFile } from "fs/promises";
import { z } from "zod";
import { env } from "./env.mjs";
import path from 'path'

const minCourse = 1
const maxCourse = 7

export const compatGeneralSettingsSchema = z.object({
    messages: z.array(z.string().or(z.object({
        text: z.string(),
        sentiment: z.string(),
    }))),
    admins: z.array(z.string()).optional().nullable(),
    sentiments: z.array(z.object({
        name: z.string().optional().nullable(),
        code: z.string(),
        color: z.string(),
    })).optional().nullable(),
    reportToEmails: z.array(z.string()).optional().nullable(),
    reeplacementSubject: z.boolean().default(false).catch(false),
    disableControlledAccess: z.boolean().default(false).catch(false),
})

export const generalSettingsSchema = z.object({
    messages: z.array(z.object({
        text: z.string(),
        sentiment: z.string(),
    })),
    admins: z.array(z.string()).optional().nullable(),
    sentiments: z.array(z.object({
        name: z.string().optional().nullable(),
        code: z.string(),
        color: z.string(),
    })),
    reportToEmails: z.array(z.string()).optional().nullable(),
    reeplacementSubject: z.boolean().default(false).catch(false),
    disableControlledAccess: z.boolean().default(false).catch(false),
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
        messages: [],
        admins: [],
        sentiments: [],
        disableControlledAccess: false,
        reeplacementSubject: false,
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
        return this.general.messages.map(message => {
            return {
                ...message,
                sentiment: this.general.sentiments.find(sentiment => sentiment.code === message.sentiment) || { color: 'black', code: 'neutral' },
            }
        });
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

            const { messages, ...general } = await compatGeneralSettingsSchema.parseAsync(importedGeneral);

            this.reset()

            const latestModelMessages = messages.map(message => {
                if (typeof message === 'string') {
                    return {
                        text: message,
                        sentiment: 'neutral'
                    }
                }
                return message
            })

            this.teachers = teachers;
            this.students = students;
            this.subjects = subjects;
            if (general.reeplacementSubject) {
                this.subjects.push(...this.createReeplacementSubjects(teachers, this.getCourses()))
            }
            this.general = {
                ...general, messages: latestModelMessages,
                sentiments: general.sentiments || [
                    { code: 'neutral', color: 'black' },
                ]
            };
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

    async getReportToEmails() {
        await this._autoImport();
        return this.general.reportToEmails || [];
    }

    _errorImporting() {
        throw new Error('Error importing data');
    }

    reset() {
        this.teachers = [];
        this.students = [];
        this.subjects = [];
        this.general = {
            messages: [],
            sentiments: [
                { code: 'neutral', color: 'black' },
            ],
            admins: [],
            disableControlledAccess: false,
            reeplacementSubject: false,
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
    async _verifySaveFile(name, data) {
        if (name === 'teachers.json') {
            const teachers = JSON.parse(data)
            return await z.array(teacherSchema).parseAsync(teachers);
        }

        if (name === 'students.json') {
            const students = JSON.parse(data)
            return await z.array(studentSchema).parseAsync(students);
        }

        if (name === 'subjects.json') {
            const subjects = JSON.parse(data)
            return await z.array(subjectSchema).parseAsync(subjects);
        }

        if (name === 'general.json') {
            const general = JSON.parse(data)
            return await compatGeneralSettingsSchema.parseAsync(general);
        }

        throw new Error('Invalid file name')
    }

    /**
     * @param {string} name 
     * @param {string} data 
    */
    async saveFile(name, data) {
        if (await this._verifySaveFile(name, data)) {
            await writeFile(path.join(env.SETTINGS_PATH, name), data)
        }
    }

    // All teachers on all courses
    /**
     * @param {z.infer<typeof teacherSchema>[]} teachers
     * @param {Array<{year: number, label: string}>} courses
     */
    createReeplacementSubjects(teachers, courses) {
        const subjects = []
        const allTeachearsEmails = teachers.map(teacher => teacher.email)
        for (const course of courses) {
            subjects.push({
                name: `Reemplazo ${course.label}`,
                code: `RPLZ${course.year}`,
                teachers: allTeachearsEmails,
                courseYear: course.year
            })
        }
        return subjects
    }
}


export const settings = new Settings()