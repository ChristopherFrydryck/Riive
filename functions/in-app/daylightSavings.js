Date.prototype.stdTimezoneOffset = function () {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

Date.prototype.isDstObserved = function () {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
}


let isDSTObserved = () => {
    var today = new Date();
    if (today.isDstObserved()) { 
        return(true)
    }else{
       return(false)
    }
}

export default isDSTObserved;
