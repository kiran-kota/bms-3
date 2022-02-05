export class Account{
    AccountId:number;
    Name: string;
    FirstName: string;
    LastName: string;
    Address:string;
    Email: string;
    Mobile: string;
    DueLimit: number;
    Balance: number;
    TotalDue: number;
    Other:string;
    TierId?: number;
    Status: boolean;
    Role: string;
    Deleted: boolean;
    UserId?:number;
}