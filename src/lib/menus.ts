import { useUserRole } from "~/lib/util/useUserRole";
import type { RouterOutputs } from "~/utils/api";

export const coursesSubMenu = (year: number, code: string | undefined, role: ReturnType<typeof useUserRole>) => [
    {
        label: 'Inicio',
        href: `/`,
    },
    ...(role.isTeacher ? [{
        label: `Mis materias`,
        href: `/mis-materias?curso=${year}`,
    },] : []),
    ...(role.isAdmin ? [{
        label: `Materias`,
        href: `/curso/${year}/materias`,
    },] : []),
    {
        label: 'Estudiantes',
        href: `/curso/${year}/estudiantes` + (code ? `?materia=${code}` : ``),
    }
]

export function useCoursesSubMenu(year: number, code?: string) {
    const role = useUserRole();
    return coursesSubMenu(year, code, role);
}

export const useMainMenu = (courses: RouterOutputs['getCourses'] | undefined,) => {
    const role = useUserRole();
    return mainMenu(courses, role);
}

export const mainMenu = (courses: RouterOutputs['getCourses'] | undefined, role: ReturnType<typeof useUserRole>) => [
    {
        label: 'Inicio',
        href: `/`,
    },
    ...(role.isTeacher ? [{
        label: `Mis materias`,
        href: `/mis-materias`,
    },] : []),
    ...(role.isTeacher ? [{
        label: 'Mis comunicaciones',
        href: '/mis-comunicaciones',
    },] : []),
    ...(role.isAdmin ? [{
        label: 'Comunicaciones',
        href: '/comunicaciones',
    },] : []),
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