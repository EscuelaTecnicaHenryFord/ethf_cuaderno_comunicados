import { api } from "~/utils/api";

export function useUserRole() {
    const { data, isInitialLoading, error } = api.getUserRole.useQuery()
    return {
        ...data,
        isLoading: isInitialLoading && !error,
    } || {
        isTeacher: true,
        isAdmin: false,
        isLoading: isInitialLoading && !error,
    }
}