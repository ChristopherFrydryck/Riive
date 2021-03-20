import {observable, computed, action} from 'mobx'

var today = new Date();

class UserStore {
    @observable userID = '';
    @observable stripeID = '';
    @observable fullname = '';
    @observable email = '';
    @observable dob = '';
    @observable phone = '';
    @observable password = '';
    @observable photo = '';
    @observable joinedDate = null;
    @observable lastUpdate = null;
    @observable listings = [];
    @observable vehicles = [];
    @observable payments = [];
    @observable searchHistory = [];
    @observable pushTokens = [];

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


}

export default new UserStore();