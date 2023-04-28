export function nameInitials(name: string) {
    const names = name.split(' ');
    if (names.length === 1 && names[0] != undefined) return names[0].charAt(0);
    if (names.length >= 2 && names[0] != undefined && names[1] != undefined) return names[0].charAt(0) + names[1].charAt(0);
}

export function transformName(name: string) {
    if (name.search(',') == -1) return name;
    const [a, b] = name.split(',')
    return `${b || ''} ${a?.slice(0, 1) || ''}${a?.slice(1).toLocaleLowerCase() || ''}`.trim()
}

export function stringToColor(string: string) {
    let hash = 0;
    let i;

    /* eslint-disable no-bitwise */
    for (i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = '#';

    for (i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }
    /* eslint-enable no-bitwise */

    return color;
}

export function stringAvatar(name: string) {
    return {
        sx: {
            bgcolor: stringToColor(name),
        },
        children: nameInitials(name),
    };
}