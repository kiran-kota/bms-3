import { List } from 'lodash';

export class Details{
    uid:String;
    email: string;
    name: string;
    company: string;
    date: Date;    
    
    reference: string;
    refperson: string;

    brands: string;
    displaynames: string;
    sites: List<string>;
    other: string;

    mobile: string
    address: string;
    status: boolean;
    verified: boolean;
}