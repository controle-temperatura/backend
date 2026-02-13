export interface CreatePasswordEmailData {
    name: string;
    createPasswordUrl: string;
    companyName: string;
    logoUrl: string;
}

export interface CreatePasswordEmailPayload {
    name: string;
    email: string;
    token: string;
    companyName: string;
    logoUrl: string;
}