import { FormGroup } from '@angular/forms';

// custom validator to check that two fields match
export function MustUnique(controlName: string, controlObject: string, controlType: string) {
    return (formGroup: FormGroup) => {
        const control = formGroup.controls[controlName];
        const list = JSON.parse(localStorage.getItem(controlObject));
        if (control.errors) {
            // return if another validator has already found an error on the matchingControl
            return;
        }

        // set error on matchingControl if validation fails

        var found = list.find(x=>x[controlType] == control.value.trim());

        if (found != null) {
            console.log(found);
            control.setErrors({ notUnique: true });
        } else {
            control.setErrors(null);
        }
    }
}