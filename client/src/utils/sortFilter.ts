export const sortFilter = (data: any, sortKey: string, sortOrder: string) => {
    return data.sort((a: any, b: any) => {
        if (sortOrder === 'asc') {
            return a[sortKey] - b[sortKey];
        } else {
            return b[sortKey] - a[sortKey];
        }
    });
}