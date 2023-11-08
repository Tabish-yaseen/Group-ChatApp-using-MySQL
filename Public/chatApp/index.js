const messageDiv=document.querySelector('#messages')

const participantForm=document.querySelector('#particpantsForm')

const addParticipantsDiv=document.querySelector('#addParticipantsbtndiv')
const userListDiv=document.querySelector('#userList')
const leaveGroupdiv=document.querySelector('#leavegroup')

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}


window.addEventListener('DOMContentLoaded',()=>{
    getAllGroups()
    
    })

const creatGroupBtn=document.querySelector('#createGroup')
creatGroupBtn.addEventListener('click',(e)=>{
    e.preventDefault()
    const groupName=prompt('Enter your group name');
    createGroup(groupName)
})

function createGroup(groupName){
    const token=localStorage.getItem('token')
    // console.log(token)
    const data={
        groupName:groupName
    }
    axios.post('http://localhost:3000/chat/createGroup',data,{headers:{'Authorization':token}}).then((res)=>{
        alert(res.data.message)
        getAllGroups()
    })

}

function getAllGroups(){
    const token=localStorage.getItem('token')
    axios.get('http://localhost:3000/chat/all-groups',{headers:{'Authorization':token}}).then((res)=>{
        // console.log(res.data.user_Groups)
          const groupLists=res.data.user_Groups
            showGroupsOnScreen(groupLists)        
    })
}

function showGroupsOnScreen(groupLists){

    const groupListDiv=document.querySelector('#groupList')
    groupListDiv.innerHTML=''

    for(let group of groupLists){
        const div=document.createElement('div')
        div.innerHTML=`<button onClick="getAllGroupMessages(${group.id})">${group.groupName}</button>`
        groupListDiv.appendChild(div)
    }        
}

function getAllGroupMessages(groupId){
    displayUserListOfGroup(groupId)
// add participant button
    addParticipantsDiv.innerHTML=''
    const addParticipantsBtn=document.createElement('button')
    addParticipantsBtn.textContent='Add More Participants'
    addParticipantsBtn.addEventListener('click',()=>{
        getParticipants(groupId)

    })

    addParticipantsDiv.appendChild(addParticipantsBtn)

    // leave group button
    leaveGroupdiv.innerHTML=''
    const leavebutton=document.createElement('button')
    leavebutton.textContent="Leave Group"
    leavebutton.addEventListener('click',()=>{
        leaveGroup(groupId)

    })
    leaveGroupdiv.appendChild(leavebutton)


    localStorage.setItem('groupId',groupId)
    
    const messages=JSON.parse(localStorage.getItem(`localchat${groupId}`)) || []
   
    const lastMessage=messages[messages.length-1]
   
    const lastMessageId=lastMessage?lastMessage.id:0
    
    axios.get(`http://localhost:3000/chat/all-messages?groupId=${groupId}&lastMessageId=${lastMessageId}`).then((res)=>{
        const newMessages=res.data.messages
        messageDiv.innerHTML=' '
       
        const oldMessages=JSON.parse(localStorage.getItem(`localchat${groupId}`))||[]
        
        const mergedMessages=[...oldMessages,...newMessages]
        const maxMessages = 20

       while (mergedMessages.length > maxMessages) {
         mergedMessages.shift() 
        }

        localStorage.setItem(`localchat${groupId}`,JSON.stringify(mergedMessages))
        
        for(let chat of mergedMessages){

            const userName=chat.userName

            const message=chat.messageContent
        
            displayMessages(userName,message)
        }
})
}
function  leaveGroup(groupId){
    // const group=document.querySelector('#group')
    const token=localStorage.getItem("token")
    axios.delete(`http://localhost:3000/chat/leaveGroup/${groupId}`,{headers:{'Authorization':token}}).then((res)=>{
        alert(res.data.message)
        getAllGroups()
        addParticipantsDiv.innerHTML=''
        userListDiv.innerHTML=''
        leaveGroupdiv.innerHTML=''
        messageDiv.innerHTML=''
       
    })

}


function getParticipants(groupId){
    participantForm.innerHTML=''
    axios.get(`http://localhost:3000/user/showParticipants/${groupId}`).then((res)=>{
        const users=res.data.users
        if(users.length===0){
           return  alert('All the users are added in your Group,there is no more users')
        }
        for(let user of users){
            participantForm.innerHTML+=`
           <div><input type='checkbox' class="user" name="user" value="${user.id}">${user.name}</div>
            `
        }
        participantForm.innerHTML+=`<input type="hidden" id="groupId"  value="${groupId}">`
        participantForm.innerHTML += `<button type="submit">Add</button>`;

    })

}

function displayUserListOfGroup(groupId){
    
    userListDiv.innerHTML=''
    axios.get(`http://localhost:3000/user/usersList/${groupId}`).then((res)=>{
        const groupName=res.data.groupName
        const userList=res.data.userList
       userListDiv.innerHTML+=`<p>${groupName}</p>`
       for(let user of userList){
        userListDiv.innerHTML+=`<span>${user.name}</span>, `
       }
    })

}

function addParticipants(e){
    e.preventDefault()
    const selectedUserId=[]

    const groupId=document.querySelector('#groupId')
    const users=document.querySelectorAll('.user')
    console.log(users)

    for(let user of users){
        if(user.checked){
            selectedUserId.push(user.value)
        }
    }

    const data={
        usersId:selectedUserId,
        groupId:groupId.value
    }
    
    axios.post('http://localhost:3000/user/add-Participants',data).then((res)=>{
        participantForm.innerHTML=''
        alert(res.data.message)
        displayUserListOfGroup(groupId.value)
    })   
}


const chatForm=document.querySelector('#chatform')

chatForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    const groupId=localStorage.getItem('groupId')
    const token=localStorage.getItem('token')
    const messageInput=document.querySelector('#messageInput')
    
    const data={
        messageContent:messageInput.value, 
        groupId:groupId
    }
    
    axios.post('http://localhost:3000/chat/message',data,{headers:{'Authorization':token}}).then((res)=>{
        chatForm.reset()
        const message=res.data.message
        const userName=res.data.userName
        displayMessages(userName,message)


    }).catch(error=>{
        alert(error.response.data.error)

    })

})

function displayMessages(name,message){
    const token=localStorage.getItem('token')

    const dname = parseJwt(token).userName
    console.log(dname)
    const p=document.createElement('p')
    if(name===dname){
        p.innerHTML=`You: ${message}`
    }
   else{
    p.innerHTML=`${name}: ${message}`

   }
   messageDiv.appendChild(p)
    

}