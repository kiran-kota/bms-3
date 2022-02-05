export class Bill{
    BillId: number;
    InvoiceNo: number;
    Token: number;
    BillNo: string;
    Date: Date;
    AccountId: number;
    
    LastBillId: number;
    LastBillNo: number;

    Qty: number;
    Total: number;
    PastDue: number;
    GrandTotal: number;
    Payment: number;
    OtherPayment: number;
    TotalDue: number;

    Profit: number;

    Remarks: string;
    Note: string;
    Type: string;

    CancelledDate: Date;
    Status: boolean;
    VerifiedBy: string;
    Edit: boolean;
    UserId: number;

    NotificationId: number;

    BillItemsList: string;
}