import {observable, computed, action, makeObservable, configure} from 'mobx'

var today = new Date();

configure({
    enforceActions: "never",
})

class UserStore {
    @observable loggedIn = false;
    @observable userID = '';
    @observable stripeID = '';
    @observable stripeConnectID = '';
    @observable mailchimpID = ''; 
    @observable directDepositInfo = {}; 
    @observable fullname = '';
    @observable email = '';
    @observable dob = '';
    @observable phone = '';
    @observable address = {};
    @observable ssnProvided = false;
    @observable password = '';
    @observable password2 = '';
    @observable photo = '';
    @observable joinedDate = null;
    @observable lastUpdate = null;
    @observable listings = [];
    @observable vehicles = [];
    @observable payments = [];
    @observable accountBalance = 0;
    @observable referralCode = null;
    @observable reports = [];
    @observable versions = [];
    @observable searchHistory = [];
    @observable pushTokens = [];
    @observable permissions = {
        notifications: {
          discountsAndNews: false,
          tripsAndHosting: false,
        }
    }

    @observable disabled = false;
    @observable deleted = false;


    @observable signInProvider = "";


    @computed get firstname() {
        return this.fullname.split(' ', 1).toString();
    }

    @computed get lastname() {
        return this.fullname.split(' ').slice(-1).join();
    }

    @computed get monthJoined() {
        return this.joinedDate;
    }

    // @computed get riiveCredit() {
    //     let paymentsArray = this.payments.map(x => x);
    //     let riiveCreditIndex = paymentsArray.findIndex(x => x.Type == "Riive Credit")
        
    //     riiveCreditIndex == -1 ? paymentsArray : paymentsArray.unshift(...paymentsArray.splice(riiveCreditIndex, 1))

    //     if(riiveCreditIndex == -1){
    //         return 0
    //     }else{
    //         return paymentsArray[0].Amount
    //     }
       
    // }

    constructor() {
        makeObservable(this)
    }

    @action
    reset = () => {
        this.loggedIn = false;
        this.userID = '';
        this.stripeID = '';
        this.stripeConnectID = '';
        this.directDepositInfo = {};
        this.fullname = '';
        this.email = '';
        this.dob = '';
        this.phone = '';
        this.address = {};
        this.ssnProvided = false;
        this.password = '';
        this.password2 = '';
        this.photo = '';
        this.joinedDate = null;
        this.lastUpdate = null;
        this.listings = [];
        this.vehicles = [];
        this.payments = [];
        this.reports = [];
        this.versions = [];
        this.searchHistory = [];
        this.pushTokens = [];
        this.permissions = {
            notifications: {
                discountsAndNews: false,
                tripsAndHosting: false,
            }
        }

        this.disabled = false;
        this.deleted = false;


        this.signInProvider = "";
    
    }


}

export default new UserStore();