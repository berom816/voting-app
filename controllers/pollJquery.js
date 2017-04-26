$(document).ready(function(){
    
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
    
    //make the div containing input for user own opinion appear if selected "submit own opinion"
    $('#selectBox').change(function(){
        var currentOption = $('#selectBox option:selected');
        if(currentOption[0].id==='userCreatedChoice'){
            $('.ownOpinionDiv').css('display','block')
        }else{
            $('.ownOpinionDiv').css('display', 'none')    
        }
    })
})
    
