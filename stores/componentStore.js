import {observable, computed, action} from 'mobx'


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




}

export default new ComponentStore();