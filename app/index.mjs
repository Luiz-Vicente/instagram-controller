import {Puppeteer, launch} from 'puppeteer';
import readlineSync from 'readline-sync';

Puppeteer.registerCustomQueryHandler('getByName', {
  queryOne: (elementOrDocument, selector) => {
    return elementOrDocument.querySelector(`[name="${selector}"]`);
  },

  queryAll: (elementOrDocument, selector) => {
    return elementOrDocument.querySelectorAll(`[name="${selector}"]`);
  },
});

async function logIn(){
  const browser = await launch({headless: false});
  const page = await browser.newPage();
  await page.goto('https://www.instagram.com/accounts/login/');

  const usernameInput = await page.waitForSelector('#loginForm > div > div:nth-child(1) > div > label > input');
  const passwordInput = await page.waitForSelector('#loginForm > div > div:nth-child(2) > div > label > input');
  const loginButton = await page.waitForSelector('#loginForm > div > div:nth-child(3)');
  
  await usernameInput.type(readlineSync.question('Username or E-mail: '));
  await passwordInput.type(readlineSync.question('Password: '));
  await loginButton.click();

  const isVerificationPage = await page.evaluate(() => {
    return true;
  });

  if(isVerificationPage){
    const verificationCodeInput = await page.waitForSelector('::-p-getByName(verificationCode)');
    await verificationCodeInput.type(readlineSync.question('Verification code: '));

    const confirmVerificationCodeButton = await page.waitForSelector('::-p-xpath(//*[@id="mount_0_0_xb"]/div/div/div[2]/div/div/div[1]/section/main/div/div/div[1]/div[2]/form/div[2]/button)');
    await confirmVerificationCodeButton.click();
  }
  
  console.log("Congrats, you are logged!");

  // await browser.close();
}

logIn();