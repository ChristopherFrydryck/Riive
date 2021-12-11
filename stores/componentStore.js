import {observable, computed, action, makeObservable, configure} from 'mobx'

configure({
    enforceActions: "never",
})

class ComponentStore {
    @observable vehiclesLoaded = false;
    @observable paymentsLoaded = false;
    @observable spotsLoaded = false;
    // @observable searchParams = {
    //     searchedAddress: null,
    //     searchInputValue: null,
    //     locationDifferenceWalking: null,
    //     region: null,
    //     daySearched: null,
    //     timeSearched: null,
    // };
    @observable selectedVehicle = [];
    @observable selectedPayment = [];
    @observable selectedSpot = [];
    @observable selectedExternalSpot = [];
    @observable selectedUser = [];
    @observable listeningToNotifications = false;


    constructor() {
        makeObservable(this)
    }

}

export default new ComponentStore();