# CONDITION LIST
| CONDITIONid | name | describe | STEP |
|---|---|---|---|
| C-ERROR | cloud_error | Worker dispatcher exception | A11 → B-SEAPP-01 |
| C-PASS | cloud_success | No log persisted | A11 |
| C-AUTH | authorized | Valid session; own records only | A-LOG |
| C-DENIED | unauthorized | No valid session | reject 401 |
