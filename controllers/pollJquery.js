$(document).ready(function(){
    // console.log('at jquery');
    // $('#userVoted').submit(function(event){
    //     console.log(JSON.stringify(event));
    //     alert(JSON.stringify(event));
    // })
    
    // When the user clicks on <span> (x), close the modal
    $('.close').click(function() {
        $('#myModal').css('display', 'none')
    })
    
    // When the user clicks anywhere outside of the modal, close it
    $('#myModal').click(function(event) {
        if(event.target.id == 'myModal') {
            $('#myModal').css('display','none');
        }
    })
    
    // $('#userCreatedChoice').focus(function(event){
    //     console.log(event)
    // })
    $('#selectBox').change(function(){
        var currentOption = $('#selectBox option:selected');
        if(currentOption[0].id==='userCreatedChoice'){
            $('.ownOpinionDiv').css('display','block')
        }else{
            $('.ownOpinionDiv').css('display', 'none')    
        }
    })
})
    
