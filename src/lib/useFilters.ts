import { useQueryState } from "next-usequerystate";
import { useState } from "react";

export function useFilters() {
    // const [dateRange, setDateRange] = useState<[number, number] | null>(null);
    const [dateRange, setDateRange] = useQueryState('dateRange', {
        parse: (value): [null, null] | [number, number] => {
            if (!value) return [null, null];
            const [from, to] = value.split('..').map(Number);
            if (Number.isInteger(from) && Number.isInteger(to)) {
                return [from || 0, to || 0];
            }
            return [null, null];
        },
        serialize: (value: [number, number] | [null, null]): string => {
            if (!value || !value[0]) return '';
            return `${value[0]}..${value[1]}`;
        },
        history: 'replace',
    })

    const [course, setCourse] = useQueryState('course', {
        parse: (value): number | null => {
            const num = Number(value);
            if (Number.isInteger(num)) {
                return num;
            }
            return null
        },
        serialize: (value: number | null): string => {
            if (!value) return '';
            return `${value}`;
        },
        history: 'replace',
    });

    const [subject, setSubject] = useQueryState('subject', {
        parse: (value): string | null => {
            return value || null;
        },
        serialize: (value: string | null): string => {
            if (!value) return '';
            return `${value}`;
        },
        history: 'replace',
    });

    const [student, setStudent] = useQueryState('student', {
        parse: (value): string | null => {
            return value || null;
        },
        serialize: (value: string | null): string => {
            if (!value) return '';
            return `${value}`;
        },
        history: 'replace',
    });
    
    const [teacher, setTeacher] = useQueryState('teacher', {
        parse: (value): string | null => {
            return value || null;
        },
        serialize: (value: string | null): string => {
            if (!value) return '';
            return `${value}`;
        },
        history: 'replace',
    });

    const [category, setCategory] = useQueryState('category', {
        parse: (value): string | null => {
            return value || null;
        },
        serialize: (value: string | null): string => {
            if (!value) return '';
            return `${value}`;
        },
        history: 'replace',
    });

    const [openDateRange, setOpenDateRange] = useState(false);
    const [openCourse, setOpenCourse] = useState(false);
    const [openSubject, setOpenSubject] = useState(false);
    const [openStudent, setOpenStudent] = useState(false);
    const [openTeacher, setOpenTeacher] = useState(false);
    const [openCategory, setOpenCategory] = useState(false);

    return {
        values: {
            course, subject, student, teacher, dateRange, category
        },
        setters: {
            setCourse, setSubject, setStudent, setTeacher, setDateRange, setCategory
        },
        pickers: {
            open: {
                dateRange: openDateRange,
                course: openCourse,
                subject: openSubject,
                student: openStudent,
                teacher: openTeacher,
                category: openCategory
            },
            setOpen: {
                dateRange: setOpenDateRange,
                course: setOpenCourse,
                subject: setOpenSubject,
                student: setOpenStudent,
                teacher: setOpenTeacher,
                category: setOpenCategory
            }
        }
    }
}