import { Injectable } from '@angular/core';

import { AngularFirestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class CrudService {

  constructor(
    private firestore: AngularFirestore
  ) { }


  create(record) {
    return this.firestore.collection('users').add(record);
  }

  read() {
    return this.firestore.collection('users').snapshotChanges();
  }

  update(recordID,record){
    this.firestore.doc('users/' + recordID).update(record);
  }

  delete(record_id) {
    this.firestore.doc('users/' + record_id).delete();
  }
}