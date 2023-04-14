import type { RouterOutputs } from "~/utils/api";

export const coursesSubMenu = (year: number, code?: string) => [
    {
        label: 'Inicio',
        href: `/`,
    },
    {
        label: `Mis materias`,
        href: `/mis-materias?curso=${year}`,
    },
    {
        label: 'Estudiantes',
        href: `/curso/${year}/estudiantes` + (code ? `?materia=${code}` : ``),
    }
]

export const mainMenu = (courses: RouterOutputs['getCourses'] | undefined) => [
    {
        label: 'Mis materias',
        href: '/mis-materias',
    },
    {
        label: 'Mis comunicaciones',
        href: '/mis-comunicaciones',
    },
    ...courses?.map(course => ({
        label: course.label,
        href: `/curso/${course.year}`,
        icon: '',
    })) || []
]

export const subjectMenu = (year: number, code: string) => [
    {
        label: `Mis materias`,
        href: `/mis-materias?curso=${year}`,
    },
    {
        label: 'Estudiantes',
        href: `/curso/${year}/estudiantes?materia=${code}`,
    }
]