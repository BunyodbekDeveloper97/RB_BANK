"use strict";

const defaultAccount1 = {
  owner: "Bruce Wayne",
  movements: [200, 7000, 455.23, -306.5, 25000, -642.21, -133.9, 79.97, 1300],
  interestRate: 1.2,
  pin: 1111,
  movementsDates: [
    "2025-11-18T21:31:17.178Z",
    "2025-12-23T07:42:02.383Z",
    "2026-01-28T09:15:04.904Z",
    "2026-04-01T10:17:24.185Z",
    "2026-05-08T14:11:59.604Z",
    "2026-05-26T17:01:17.194Z",
    "2026-05-29T23:36:17.929Z",
    "2026-05-30T10:51:36.790Z",
    "2026-05-31T04:17:21Z",
  ],
  currency: "USD",
  locale: "en-US",
};

const defaultAccount2 = {
  owner: "Bruce Buffer",
  movements: [50000, 3400, -1500, -790, -320, -1000, 850, -300],
  interestRate: 1.5,
  pin: 2222,
  movementsDates: [
    "2025-05-30T16:14:08Z",
    "2025-07-05T18:01:19Z",
    "2025-09-29T19:21:22Z",
    "2026-04-10T23:20:31Z",
    "2026-05-21T19:01:30Z",
    "2026-05-25T08:36:42Z",
    "2026-05-30T06:09:06Z",
    "2026-05-31T05:26:09Z",
  ],
  currency: "EUR",
  locale: "de-DE",
};

let accounts = JSON.parse(localStorage.getItem("bankAccounts"));
if (!accounts) {
  accounts = [defaultAccount1, defaultAccount2];
  localStorage.setItem("bankAccounts", JSON.stringify(accounts));
}

// DOM Elements
const labelWelcome = document.querySelector(".welcome");
const labelDate = document.querySelector(".date");
const labelBalance = document.querySelector(".balance__value");
const labelSumIn = document.querySelector(".summary__value--in");
const labelSumOut = document.querySelector(".summary__value--out");
const labelSumInterest = document.querySelector(".summary__value--interest");
const labelTimer = document.querySelector(".timer");

const containerApp = document.querySelector(".app");
const containerMovements = document.querySelector(".movements");
const filterButtons = document.querySelectorAll(".filter-btn");

const btnLogin = document.querySelector(".login__btn");
const btnTransfer = document.querySelector(".form__btn--transfer");
const btnLoan = document.querySelector(".form__btn--loan");
const btnClose = document.querySelector(".form__btn--close");
const btnSort = document.querySelector(".btn--sort");

const inputLoginUsername = document.querySelector(".login__input--user");
const inputLoginPin = document.querySelector(".login__input--pin");
const inputTransferTo = document.querySelector(".form__input--to");
const inputTransferAmount = document.querySelector(".form__input--amount");
const inputLoanAmount = document.querySelector(".form__input--loan-amount");
const inputCloseUsername = document.querySelector(".form__input--user");
const inputClosePin = document.querySelector(".form__input--pin");

// Global States
let currentAccount, timer;
let sorted = false;
let currentFilter = "all";

const updateLocalStorage = function () {
  localStorage.setItem("bankAccounts", JSON.stringify(accounts));
};

const formatMovementDate = function (date, locale) {
  const calcDaysPassed = (date1, date2) =>
    Math.floor(Math.abs(date2 - date1) / (1000 * 60 * 60 * 24));
  const daysPassed = calcDaysPassed(new Date(), date);
  if (daysPassed === 0) return "Today";
  if (daysPassed === 1) return "Yesterday";
  if (daysPassed <= 7) return `${daysPassed} days ago`;
  return new Intl.DateTimeFormat(locale).format(date);
};

const formatCur = function (value, locale, currency) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    value,
  );
};

const displayMovements = function (acc, sort = false, filter = "all") {
  containerMovements.innerHTML = "";

  let combined = acc.movements.map((mov, i) => ({
    mov,
    date: acc.movementsDates[i],
    originalIndex: i,
  }));

  if (filter === "deposit") combined = combined.filter((item) => item.mov > 0);
  else if (filter === "withdrawal")
    combined = combined.filter((item) => item.mov < 0);

  const sortedCombined = sort
    ? combined.slice().sort((a, b) => a.mov - b.mov)
    : combined;

  sortedCombined.forEach(function ({ mov, date, originalIndex }) {
    const type = mov > 0 ? "deposit" : "withdrawal";
    const displayDate = formatMovementDate(new Date(date), acc.locale);
    const formattedMov = formatCur(mov, acc.locale, acc.currency);
    const html = `
      <div class="movements__row">
        <div class="movements__type movements__type--${type}">${originalIndex + 1} ${type}</div>
        <div class="movements__date">${displayDate}</div>
        <div class="movements__value">${formattedMov}</div>
      </div>`;
    containerMovements.insertAdjacentHTML("afterbegin", html);
  });
};

const calcDisplayBalance = function (acc) {
  acc.balance = acc.movements.reduce((sum, mov) => sum + mov, 0);
  labelBalance.textContent = formatCur(acc.balance, acc.locale, acc.currency);
};

const calcDisplaySummary = function (acc) {
  const incomes = acc.movements.filter((m) => m > 0).reduce((s, m) => s + m, 0);
  labelSumIn.textContent = formatCur(incomes, acc.locale, acc.currency);

  const out = acc.movements.filter((m) => m < 0).reduce((s, m) => s + m, 0);
  labelSumOut.textContent = formatCur(Math.abs(out), acc.locale, acc.currency);

  const interest = acc.movements
    .filter((m) => m > 0)
    .map((d) => (d * acc.interestRate) / 100)
    .filter((i) => i >= 1)
    .reduce((s, i) => s + i, 0);
  labelSumInterest.textContent = formatCur(interest, acc.locale, acc.currency);
};

const createUsernames = function (accs) {
  accs.forEach((acc) => {
    acc.username = acc.owner
      .toLowerCase()
      .split(" ")
      .map((n) => n[0])
      .join("");
  });
};
createUsernames(accounts);

const updateUI = function (acc) {
  displayMovements(acc, sorted, currentFilter);
  calcDisplayBalance(acc);
  calcDisplaySummary(acc);
};

const startLogOutTimer = function () {
  let time = 300;
  const tick = function () {
    const min = String(Math.trunc(time / 60)).padStart(2, "0");
    const sec = String(time % 60).padStart(2, "0");
    labelTimer.textContent = `${min}:${sec}`;
    if (time === 0) {
      clearInterval(interval);
      labelWelcome.textContent = "Log in to get started";
      containerApp.classList.remove("visible");
      currentAccount = null;
    }
    time--;
  };
  tick();
  const interval = setInterval(tick, 1000);
  return interval;
};

// LOGIN
const handleLogin = function () {
  currentAccount = accounts.find(
    (acc) => acc.username === inputLoginUsername.value.trim().toLowerCase(),
  );

  if (currentAccount?.pin === +inputLoginPin.value) {
    labelWelcome.textContent = `Welcome back, ${currentAccount.owner.split(" ")[0]}!`;
    containerApp.classList.add("visible");

    const now = new Date();
    const options = {
      hour: "numeric",
      minute: "numeric",
      day: "numeric",
      month: "numeric",
      year: "numeric",
    };
    labelDate.textContent = new Intl.DateTimeFormat(
      currentAccount.locale,
      options,
    ).format(now);

    inputLoginUsername.value = "";
    inputLoginPin.value = "";
    inputLoginPin.blur();
    inputLoginUsername.blur();

    sorted = false;
    currentFilter = "all";
    filterButtons.forEach((btn) => btn.classList.remove("filter-btn--active"));
    document
      .querySelector('[data-filter="all"]')
      .classList.add("filter-btn--active");

    if (timer) clearInterval(timer);
    timer = startLogOutTimer();
    updateUI(currentAccount);
  } else if (inputLoginUsername.value || inputLoginPin.value) {
    labelWelcome.textContent = "Wrong credentials. Try again.";
    setTimeout(() => {
      if (!currentAccount) labelWelcome.textContent = "Log in to get started";
    }, 2500);
  }
};

btnLogin.addEventListener("click", handleLogin);
inputLoginPin.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleLogin();
});
inputLoginUsername.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleLogin();
});

// TRANSFER
btnTransfer.addEventListener("click", function () {
  const amount = +inputTransferAmount.value;
  const receiverAcc = accounts.find(
    (acc) => acc.username === inputTransferTo.value.trim().toLowerCase(),
  );
  inputTransferAmount.value = "";
  inputTransferTo.value = "";

  if (
    amount > 0 &&
    receiverAcc &&
    currentAccount.balance >= amount &&
    receiverAcc?.username !== currentAccount.username
  ) {
    currentAccount.movements.push(-amount);
    receiverAcc.movements.push(amount);
    currentAccount.movementsDates.push(new Date().toISOString());
    receiverAcc.movementsDates.push(new Date().toISOString());
    updateLocalStorage();
    updateUI(currentAccount);
    clearInterval(timer);
    timer = startLogOutTimer();
  }
});

// LOAN
btnLoan.addEventListener("click", function () {
  const amount = Math.floor(+inputLoanAmount.value);
  if (
    amount > 0 &&
    currentAccount.movements.some((mov) => mov >= amount * 0.1)
  ) {
    const loanAccount = currentAccount;
    setTimeout(function () {
      if (currentAccount && currentAccount === loanAccount) {
        currentAccount.movements.push(amount);
        currentAccount.movementsDates.push(new Date().toISOString());
        updateLocalStorage();
        updateUI(currentAccount);
        clearInterval(timer);
        timer = startLogOutTimer();
      }
    }, 2500);
  }
  inputLoanAmount.value = "";
});

// CLOSE ACCOUNT
btnClose.addEventListener("click", function () {
  if (
    inputCloseUsername.value.trim().toLowerCase() === currentAccount.username &&
    +inputClosePin.value === currentAccount.pin
  ) {
    const index = accounts.findIndex(
      (acc) => acc.username === currentAccount.username,
    );
    accounts.splice(index, 1);
    updateLocalStorage();
    containerApp.classList.remove("visible");
    labelWelcome.textContent = "Log in to get started";
    currentAccount = null;
    if (timer) clearInterval(timer);
  }
  inputCloseUsername.value = "";
  inputClosePin.value = "";
});

// SORT
btnSort.addEventListener("click", function () {
  sorted = !sorted;
  displayMovements(currentAccount, sorted, currentFilter);
});

// FILTERS
filterButtons.forEach((btn) => {
  btn.addEventListener("click", function () {
    filterButtons.forEach((b) => b.classList.remove("filter-btn--active"));
    this.classList.add("filter-btn--active");
    currentFilter = this.dataset.filter;
    displayMovements(currentAccount, sorted, currentFilter);
  });
});
