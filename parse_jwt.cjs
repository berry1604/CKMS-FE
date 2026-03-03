function parseJwt(token) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}
console.log(parseJwt("eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJjb29yZGluYXRvciIsInVzZXJJZCI6Mywicm9sZXMiOlsiQ09PUkRJTkFUT1IiXSwic2NvcGUiOiJTWVNURU0iLCJjb29yZGluYXRvcklkIjoxLCJpYXQiOjE3NzI1MTg0OTAsImV4cCI6MTc3MjUxOTM5MH0.K5LBAQalNIWWEsEGnvz9PJI0ONQ-ijz8fjEPIvqhfqwJcH0KpKwTlagWi61hQUNh"));
