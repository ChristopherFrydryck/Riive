const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')('sk_test_rhRKZJYIAphopgJZcoKX32yD00ciJsrqFl');
admin.initializeApp();
const db = admin.firestore();

const fs = require('fs');

// exports.payWithStripe = functions.https.onRequest((request, response) => {
    // Set your secret key: remember to change this to your live secret key in production
    // See your keys here: https://dashboard.stripe.com/account/apikeys

    // eslint-disable-next-line promise/catch-or-return

    exports.getUserDataFromEmail = functions.https.onRequest((request, response) => {
        if(request.method !== "POST"){
            response.send(405, 'HTTP Method ' +request.method+' not allowed');
        }else{
            admin.auth().getUserByEmail(request.body.email).then((snap) => {
                return snap
            }).then((snap) => {
                response.status(200).send(snap);
                return snap
            }).catch(e => {
                console.log('Error fetching user data:', e)
                response.status(500).send(e);
            })
        }
       
    })

    exports.addCustomerAddress = functions.https.onRequest((request, response) => {
        stripe.customers.update(
            request.body.customerID,
            {
                address: {
                    line1: request.body.lineOne,
                    line2: request.body.lineTwo || null,
                    postal_code: request.body.zipCode,
                    city: request.body.city,
                    state: request.body.state,
                    country: "US"
                },
            }
        ).then(() => {
            return stripe.accounts.update(
                request.body.accountID,
                {
                    individual: {
                        address: {
                            line1: request.body.lineOne,
                            line2: request.body.lineTwo || null,
                            postal_code: request.body.zipCode,
                            city: request.body.city,
                            state: request.body.state,
                            country: "US"
                        },
                    },
                    // id_number: request.body.ssn,
                }
            )
        }).then(() => {
            db.collection('users').doc(request.body.FBID).get()
            .then(doc => {
                if(!doc.exists){
                    throw new Error("User does not exist")
                }else{
                    return db.collection('users').doc(request.body.FBID).update({
                        primaryAddress: {
                            line1: request.body.lineOne,
                            line2: request.body.lineTwo || null,
                            postal_code: request.body.zipCode,
                            city: request.body.city,
                            state: request.body.state,
                            country: "US"
                        },
                        // ssnProvided: true
                    })
                }
            })
        })
    })


    exports.addCustomer = functions.https.onRequest((request, response) => {
        stripe.customers.create(
            {
              name: request.body.name,
              email: request.body.email,
              phone: request.body.phone,
              description: "FB ID = " + request.body.FBID,
            },
            function(err, customer) {
              if (err){
                  return response.status(500).send(err)
              }else{
                  return db.collection('users').doc(request.body.FBID).get()
                  .then(doc => {
                    if(!doc.exists){
                        throw new Error("User does not exist")
                    }else{

                        return stripe.accounts.create({
                            type: 'custom',
                            email: request.body.email,
                            business_type: "individual",
                            business_profile: {
                                mcc: "7523",
                                product_description: request.body.FBID, 
                                support_email: request.body.email,
                                support_phone: request.body.phone,
                            },
                            capabilities: {
                                card_payments: {requested: true},
                                transfers: {requested: true},
                                tax_reporting_us_1099_k: {requested: true},
                            },
                            tos_acceptance: {
                                date: Math.floor(Date.now() / 1000),
                                ip: request.socket.remoteAddress,
                              },
                            individual: {
                                dob: {
                                    day: request.body.dob.split("/")[1],
                                    month: request.body.dob.split("/")[0],
                                    year: request.body.dob.split("/")[2]
                                },
                                // address: {
                                //     line1: "430 Partridge Run Road",
                                //     line2: "",
                                //     postal_code: 15044,
                                //     city: "Gibsonia",
                                //     state: "Pennsylvania",
                                //     country: "US"
                                // },
                                email: request.body.email,
                                phone: request.body.phone,
                                first_name: request.body.name.split(' ', 1).toString(),
                                last_name: request.body.name.split(' ').slice(-1).join(),
                                // id_number: token.id,
                            }
                        }).then((account) => {
                            db.collection('users').doc(request.body.FBID).update({
                                stripeID: customer.id,
                                stripeConnectID: account.id,
                            })
                            return response.send("")
                        })
                        .catch(err => {
                            return response.status(500).send(err)
                        })
                    }
                  }).catch(err => {
                    return response.status(500).send(err)
                  })
                  
                  
              }
            }            
        )

    } )

    exports.sendNotification = functions.https.onRequest((request, response) => {
        let tokenArray = request.body.tokens;
        let payload = {
            notification: {
              title: request.body.title,
              body: request.body.message,
            },
            data:{
                screen: request.body.screen
            }
          };

     
        admin.messaging().sendToDevice(tokenArray, payload).catch(err => {
            console.log("Error sending message: ", err)
        })
    })

    exports.addSource = functions.https.onRequest((request, response) => {

        // Payment method created. Still needs set up and confirmed
        return stripe.paymentMethods.create({
                type: 'card',
                card: {
                  number: request.body.number,
                  exp_month: request.body.expMonth,
                  exp_year: request.body.expYear,
                  cvc: request.body.cvc,
                },
                billing_details: {
                    name: request.body.name
                }
              })
        .then((result) => {
            if(result.error){
           
                const error = new Error("Failed to create payment method")
                error.statusCode = 401;
                error.name = 'Stripe/PaymentMethodFailure'
                throw error;
                
            }else{
                return result
            }
        })    
        .then( async(card) => {
            // Set up and send to Stripe customer
            const setupIntent = await stripe.setupIntents.create({
                customer: request.body.stripeID,
                payment_method: card.id,
                payment_method_types: ["card"],
                confirm: true,
            });
            // await console.log(`created setup intent with : ${setupIntent.id}`)
           
            return [setupIntent, card.id]
            
        })
        .then((result) => {
            if(result[0].error){
                const error = new Error("Failed to confirm")
                error.statusCode = 503;
                error.name = 'Stripe/SetupIntentFailure'
                throw error;
            }else{
                return result
            }
        }).then(async(result) => {
            // Get user info
            const userData = await db.collection('users').doc(request.body.FBID).get();
            return [userData, ...result]   
        }).then((doc) => {
            if(!doc[0].exists){
                const error = new Error("Failed to get your information")
                error.statusCode = 404;
                error.name = 'Auth/UserDoesNotExist'
                throw error;
            }else{

                
                const ref = db.collection("users").doc();
                  // add card to database
                
                    db.collection("users").doc(request.body.FBID).update({
                        payments: admin.firestore.FieldValue.arrayUnion({
                            PaymentID: ref.id,
                            StripeID: doc[1].id,
                            StripePMID: doc[2],
                            Type: "Card",
                            CardType: request.body.creditCardType !== "" ? request.body.creditCardType : "Credit",
                            Name: request.body.name,
                            Month: request.body.expMonth,
                            Year: request.body.expYear,
                            Number: request.body.number.slice(-4),
                            CCV: request.body.cvc,
                        })
                    })
           

    
                response.status(200).send({
                    statusCode: 200,
                    message: "Successfully saved card",
                    card: {
                        PaymentID: ref.id,
                        StripeID: doc[1].id,
                        StripePMID: doc[2],
                        Type: "Card",
                        CardType: request.body.creditCardType !== "" ? request.body.creditCardType : "Credit",
                        Name: request.body.name,
                        Month: request.body.expMonth,
                        Year: request.body.expYear,
                        Number: request.body.number.slice(-4),
                        CCV: request.body.cvc,
                    },
                })
                return doc[1];
            }
        }).catch(async(err) => {

        


            // If error is after mounting payment to stripe, detatch it
            if(err.statusCode === 404){
                await stripe.paymentMethods.detach(
                    pmID
                );
            }
            
            return response.status(err.statusCode || 500).send({
                statusCode: err.statusCode,
                message: err.message,
                name: err.name
            })
            
            
        })
    })


    exports.deleteSource = functions.https.onRequest((request, response) => {
        db.collection("users").doc(request.body.FBID).get().then(async(doc) => {
            if(!doc.exists){
                response.status(500).send("Failed to gather your data from our servers")
                throw new Error ("Failed to gather your data from our servers")
            }else{
                
                let newPaymentsArray = await doc.data().payments.filter(x => x.PaymentID !== request.body.PaymentID)
                await db.collection("users").doc(request.body.FBID).update({
                    payments: newPaymentsArray
                })
                return doc
            }
        }).then((doc) => {
            stripe.paymentMethods.detach(request.body.StripePMID)
            return doc
        }).then(data => {
            return response.send({
                statusCode: 200,
                res: "SUCCESS",
                data: data,
                removedCardID: request.body.PaymentID,
            })
        }).catch((err) => {
           console.log("ERROR! " + err)
           response.status(500).send(err)
           return null
        })
    })

    exports.payForSpace = functions.https.onRequest((request, response) => {
        stripe.paymentIntents.create({
            payment_method_types: ['card'],
            amount: request.body.amount,
            currency: 'usd',
            customer: request.body.visitorID,
            payment_method: request.body.cardID,
            receipt_email: request.body.customerEmail,
            application_fee_amount: request.body.transactionFee,
            transfer_data: {
              destination: request.body.hostID,
            },
          }).then(function(result) {
            if (result.error) {
              throw result.error
            } else {
                console.log("SUCCESS")
                return null
              // The payment has succeeded
              // Display a success message
            }
        }).catch((e) => {
            console.log("Failed process because of " + e)
            return null;
        });
    })

    exports.deleteSpace = functions.firestore.document('listings/{listingID}').onDelete((snap, context) => {
        const { listingID } = context.params;
        const bucket = admin.storage().bucket('gs://riive-parking.appspot.com');

        bucket.deleteFiles({
            prefix: `listings/${listingID}`
        }).then(async() => {
            
            return db.collection("users").doc(snap.data().hostID).update({
                listings: admin.firestore.FieldValue.arrayRemove(listingID)
            })
        }).then(() => {
            return null
        }).catch(e => {return e})

    })

    exports.everySixHours = functions.pubsub.schedule('0 */6 * * *').timeZone('America/New_York').onRun(() => {

        const query = db.collection("users")
        .where("disabled.isDisabled", "==", true)

        query.get().then(snapshot => {
            if (snapshot.empty) {
                throw new Error('no disabled users.')
            }

                let usersNeedingUpdated = [];
                snapshot.forEach(doc => {
                    // console.log(doc.id, '=>', doc.data());

                    if(doc.data().disabled.disabledEnds < Math.round((new Date()).getTime() / 1000) && doc.data().disabled.numTimesDisabled < 3){
                        usersNeedingUpdated.push(doc.data())
                    }
                });
                return usersNeedingUpdated
        }).then(users => {
            users.forEach(async (x, i) => {
                await db.collection("users").doc(x.id).update({
                    "disabled.isDisabled": false
                })
                await admin.auth().updateUser(x.id, {
                    disabled: false,
                });
                return null
            })
            
            return null
        }).catch(e => {
            return e
        })

        return null;

        

        
            // .get().then( async(snapshot) => {
            //     let needsUpdated = [];
            //     await snapshot.docs.forEach((x, i) => {
            //         needsUpdated.push(x)
            //     })
            //     return needsUpdated
            // }).then((users) => {
            //     console.log(users)
            //     return null
            // })
    });

    

    exports.deleteUser = functions.auth.user().onDelete((event) => {
        const { uid } = event;
        const bucket = admin.storage().bucket('gs://riive-parking.appspot.com');
       
        
        db.collection('users').doc(uid).get().then((doc) => {
            if(!doc.exists){
                console.log("User doesn't exist")
                throw new Error("User doesn't exist");
            }else{
                let userData = doc.data()
                

                return userData;




                



                // console.log(doc.data().listings)



                // for(let i = 0 ; i < userData.listings.length; i++){
                //     db.collection("listings").doc(userData.listings[i]).update({
                //         hidden: true,
                //         toBeDeleted: true
                //     })
                // }

                // return null
                // bucket.deleteFiles({
                //     prefix: `users/${uid}`
                // })
            
            }
        }).then((userData) => {
            let allListings = [];


            if(userData.listings.length > 0 && userData.listings.length <= 10){
                db.collection("listings").where(admin.firestore.FieldPath.documentId(), "in", userData.listings).get().then((qs) => {
                    for(let i = 0; i < qs.docs.length; i++){
                        allListings.push(qs.docs[i].data())
                    }
                    return allListings;
                }).catch(e => {
                    throw new Error("Failed to gather listing data")
                })

                return [userData, allListings]

            }else if(userData.listings.length > 10){
                let allArrs = [];
                while(userData.listings.length > 0){
                    allArrs.push(userData.listings.splice(0, 10))
                }
                for(let i = 0; i < allArrs.length; i++){
                    db.collection('listings').where(admin.firestore.FieldPath.documentId(), "in", allArrs[i]).get().then((qs) => {
                        for(let i = 0; i < qs.docs.length; i++){
                            allListings.push(qs.docs[i].data())
                        }
                        return allListings;
                    }).catch(e => {
                        throw new Error("Failed to gather listing data")
                    })
                }

                return [userData, allListings]

            }else{
                console.log("User had no listings")
                return [userData, null]
            }

            

        
        }).then((data) => {
            console.log(`
                user data: ${JSON.stringify(data[0])}
                listing data: ${JSON.stringify(data[1])}
            `)
            return null;
        }).catch(e => {
            return console.error(e)
        })

        return null;
        // bucket.deleteFiles({
        //     prefix: `users/${userID}`
        // }).then(() => {
        //     return console.log("Getting")
        //     // return db.collection('users').doc({userID}).get()
        // }).then((doc) => {
        //     return console.log("Uhhh")
        //     // if(!doc.exists){
        //     //     return console.log("User doesn't exist")
        //     // }else{
        //     //     return console.log(doc.data())
        //     // }
        // }).then(() => {
        //    return console.log("Completed Function")
        // }).catch(e => {return e})

    })
    

  

    exports.updateUserInfo = functions.firestore
    .document('users/{user_id}')
    .onUpdate((snap, context) => {
       var beforeUser = snap.before.data() 
       var afterUser = snap.after.data()
       var currentTime = admin.firestore.Timestamp.now();
       var disabledUntilDate = new Date(afterUser.disabled.disabledEnds * 1000)
       var date = new Date();

        // When changelog updates, update the file located at https://firebasestorage.googleapis.com/v0/b/riive-parking.appspot.com/o/dev-team%2Fchangelog.json?alt=media&token=9210aa16-dd93-41df-8246-a17c58a4ee9e

        


        
        
        
       
        // 10 second latency before we will update the last_update field in someone's profile
       if(currentTime - beforeUser.last_update >= 10 || !beforeUser.last_update){

        db.collection('users').doc(context.params.user_id).update({
            last_update: currentTime
        }).then(() => {
            // Suspension check
            if(afterUser.disabled.isDisabled && disabledUntilDate < date){
                // First suspension
                if(beforeUser.disabled.numTimesDisabled === 0){
                    admin.auth().updateUser(context.params.user_id, {
                        disabled: true,
                    });
                    db.collection('users').doc(context.params.user_id).update({
                        disabled: {
                            isDisabled: true,
                            numTimesDisabled: 1,
                            disabledEnds: Math.round((new Date()).getTime() / 1000) + 24*3600,
                        }
                    })
                // Second Suspension
                }else if(beforeUser.disabled.numTimesDisabled === 1){
                    admin.auth().updateUser(context.params.user_id, {
                        disabled: true,
                    });
                    db.collection('users').doc(context.params.user_id).update({
                        disabled: {
                            isDisabled: true,
                            numTimesDisabled: 2,
                            disabledEnds: Math.round((new Date()).getTime() / 1000) + 3*24*3600,
                        }
                    })
                // Third Suspension
                }else if (beforeUser.disabled.numTimesDisabled >= 2){
                    admin.auth().updateUser(context.params.user_id, {
                        disabled: true,
                    });
                    db.collection('users').doc(context.params.user_id).update({
                        disabled: {
                            isDisabled: true,
                            numTimesDisabled: 3,
                            disabledEnds: 9999999999,
                        }
                    })
                }
            }

            return null
        }).then(() => {
            return admin.storage().bucket('gs://riive-parking.appspot.com').file('dev-team/changelog.json').download()
        }).then((res) => {
            return JSON.parse(res)
        }).then((changelog) => {

            var versionsBehind;

            if(!beforeUser.last_update){
                versionsBehind = changelog.versions.filter(x => x.isReleased)
            }else{
                versionsBehind = changelog.versions.filter(x => x.dateUnix > beforeUser.last_update.toMillis() && x.isReleased)
            }
            
            // Checks if user is behind in changelog versions
            for(var i = 0; i < versionsBehind.length; i++){
                switch(versionsBehind[i].major){
                    // Version 1
                    case 1:
                        switch(versionsBehind[i].minor){
                            // Version 1.0
                            case 0:
                                switch(versionsBehind[i].patch){
                                    // Version 1.0.0
                                    case 0:
                                        // console.log("Patch 1.0.0")
                                        // db.collection('users').doc(context.params.user_id).update({
                                        //     otherValue: beforeUser.otherValue ? afterUser.otherValue : "hello",
                                        //     newValue: beforeUser.newValue ? afterUser.newValue :"world"
                                        // });
                                        for(let i = 0; i < afterUser.listings.length; i++){
                                            db.collection('listings').doc(afterUser.listings[i]).update({
                                                hidden: false,
                                                toBeDeleted: false,
                                                visits: 0, 
                                            })
                                        }
                                        
                                        break;

                                    // Version 1.0.1
                                    case 1: 
                                        // console.log("Patch 1.0.1")
                                        // db.collection('users').doc(context.params.user_id).update({
                                        //     otherValue: "goodbye"
                                        // })
                                      break;

                                }
                            break;
                        }
                    break
                }
            }
            return null
            
        }).catch((e) => {
            throw e
        })
            
            return null
        }else{
            return null
        }
       
    
   
    })



   
    

    


        
    


//     stripe.charges.create({
//         amount: request.body.amount,
//         currency: request.body.currency,
//         source: request.body.token,
//     }).then((charge) => {
//             // asynchronously called
//             response.send(charge);
//         })
//         .catch(err =>{
//             console.log(err);
//         });

// });



// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
