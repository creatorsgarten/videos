import inquirer from 'inquirer'
import { getAuthUrl, login } from '../GoogleAuth'

console.log('Authorize this app by visiting this url:', await getAuthUrl())
console.log()

const result = await inquirer.prompt({
  type: 'input',
  name: 'code',
  message: 'Enter the code from that page here: ',
})

await login(result.code)
