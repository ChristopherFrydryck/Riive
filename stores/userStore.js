import {observable, computed, action, makeObservable} from 'mobx'

var today = new Date();

class UserStore {
    @observable loggedIn = false;
    @observable userID = '';
    @observable stripeID = '';
    @observable stripeConnectID = '';
    @observable directDepositInfo = {}; 
    @observable fullname = '';
    @observable email = '';
    @observable dob = '';
    @observable phone = '';
    @observable address = {};
    @observable ssnProvided = false;
    @observable password = '';
    @observable photo = '';
    @observable joinedDate = null;
    @observable lastUpdate = null;
    @observable listings = [];
    @observable vehicles = [];
    @observable payments = [];
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