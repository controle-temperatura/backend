export interface CreatePasswordEmailData {
    name: string;
    createPasswordUrl: string;
    companyName: string;
    companyShortName: string;
    logoUrl: string;
}

export interface CreatePasswordEmailPayload {
    name: string;
    email: string;
    token: string;
    companyName: string;
    companyShortName: string;
    logoUrl: string;
    companyId: string;
}

export interface BroadcastEmailPayload {
    email: string;
    title: string;
    message: string;
}