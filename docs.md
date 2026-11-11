Booking system incomplete in backend 

so how booking works 
first:- User(patient) select the test they want to need form tests page
2:- click to that test(blood test) one page open for that test where the test of that page they click to buy then pop up it say time slot and date then after confrim the slot then user clcik to buy.
Valid transitions:

PENDING → CONFIRMED (SYSTEM only)
PENDING → CANCELLED (USER or ADMIN)
CONFIRMED → COMPLETED (ADMIN/SYSTEM)
Invalid transitions: i didn't think now 

PAYEMNT 

Owner: SYSTEM
Initiated by: USER
Confirmed by: SYSTEM (webhook)
Admin can: (I DIDN'T THINK OF THESE thing now so , not sure) for refund (i think direct call would be good option)
Users/Admins can NEVER set PAID

TimeSlot

Owner: ADMIN
Created/updated by: ADMIN
User access: READ ONLY
Capacity: 30 like in 1 hour  only 25 or 30 patient can book

Tests

Owner: ADMIN
Created/updated/deleted by: ADMIN
User access: READ ONLY

RBAC TRUTH

Auth provider = identity only
DB = authority

*important things*
A user must never create or edit a time slot
A booking must never be CONFIRMED without system verification
Payment PAID must never be set by client input
Admin actions must never be silent (must be logged)