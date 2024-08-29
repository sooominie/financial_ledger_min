// script.js
document.addEventListener('DOMContentLoaded', () => {
    // 서버에서 전달된 데이터를 가져와서 #goal-list에 추가하는 로직
    // 예: 서버에서 데이터를 JSON으로 전달하는 경우
    fetch('/get-goals') // 서버에서 목표 데이터를 가져오는 엔드포인트
        .then(response => response.json())
        .then(data => {
            const goalList = document.getElementById('goal-list');
            data.forEach(item => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `${item.months}달 동안의 목표: ${item.goal} <br/> 계획: ${item.plan}`;
                goalList.appendChild(listItem);
            });
        })
        .catch(error => console.error('Error fetching goals:', error));
});
