/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import mockStore from "../__mocks__/store";
import Bills from "../containers/Bills.js";
import router from "../app/Router.js";
jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
    describe("When I am on Bills Page", () => {
        test("Then bill icon in vertical layout should be highlighted", async () => {
            Object.defineProperty(window, "localStorage", {
                value: localStorageMock,
            });
            window.localStorage.setItem(
                "user",
                JSON.stringify({
                    type: "Employee",
                })
            );
            const root = document.createElement("div");
            root.setAttribute("id", "root");
            document.body.append(root);
            router();
            window.onNavigate(ROUTES_PATH.Bills);

            await waitFor(() => screen.getByTestId("icon-window"));
            const windowIcon = screen.getByTestId("icon-window");
            //to-do write expect expression
            expect(windowIcon).toHaveClass("active-icon"); //////// [Ajout de tests unitaires et d'intégration]
        });

        test("Then bills should be ordered from earliest to latest", () => {
            document.body.innerHTML = BillsUI({ data: bills });
            const dates = screen
                .getAllByText(
                    /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
                )
                .map((a) => a.innerHTML);
            const antiChrono = (a, b) => (a < b ? 1 : -1);
            const datesSorted = [...dates].sort(antiChrono);
            expect(dates).toEqual(datesSorted);
        });

        //////ajout test
        describe("When I click on the eye icon", () => {
            test("Then the modal with the image should display", () => {
                Object.defineProperty(window, "localStorage", {
                    value: localStorageMock,
                });

                window.localStorage.setItem(
                    "user",
                    JSON.stringify({
                        type: "Employee",
                    })
                );

                const root = document.createElement("div");
                root.setAttribute("id", "root");
                document.body.append(root);
                router();
                window.onNavigate(ROUTES_PATH.Bills);

                const modaleFile = document.body.querySelector("#modaleFile");
                const eyeIcon = document.body.querySelector("#eye");

                //on simule la fonction modal de boostrap car jest n'inclu pas jquery son environnement de test
                $.fn.modal = jest.fn(() => {
                    $("#modaleFile").addClass("show");
                    $("#modaleFile").css("display", "block");
                });

                userEvent.click(eyeIcon);

                expect(modaleFile).toHaveClass("show");
            });
        });

        describe("When I click on new bills", () => {
            test("then we should navigate on the new bill page ", async () => {
                Object.defineProperty(window, "localStorage", {
                    value: localStorageMock,
                });

                window.localStorage.setItem(
                    "user",
                    JSON.stringify({
                        type: "Employee",
                    })
                );

                const root = document.createElement("div");
                root.setAttribute("id", "root");
                document.body.append(root);
                router();
                window.onNavigate(ROUTES_PATH.Bills);

                let newBillButton = screen.getByTestId("btn-new-bill");

                await userEvent.click(newBillButton);

                let newBillForm = screen.getByTestId("form-new-bill");

                expect(newBillForm).toBeTruthy();
            });
        });

        //GET
        test("Then we should get all the bill", async () => {
            window.localStorage.setItem(
                "user",
                JSON.stringify({
                    type: "Employee",
                })
            );
            const root = document.createElement("div");
            root.setAttribute("id", "root");
            document.body.append(root);
            router();
            window.onNavigate(ROUTES_PATH.Bills);

            await waitFor(() => screen.getByText("Mes notes de frais"));
            const newBillButton = screen.getByTestId("btn-new-bill");
            expect(newBillButton).toBeTruthy();
            const billsTableBody = screen.getByTestId("tbody");

            expect(billsTableBody.innerHTML).toBeTruthy();
        });

        describe("When the bills API fetch fails", () => {
            beforeEach(() => {
                jest.spyOn(mockStore, "bills");
                Object.defineProperty(window, "localStorage", {
                    value: localStorageMock,
                });
                window.localStorage.setItem(
                    "user",
                    JSON.stringify({
                        type: "Employee",
                        email: "employee@test.tld",
                        password: "employee",
                    })
                );
                const root = document.createElement("div");
                root.setAttribute("id", "root");
                document.body.appendChild(root);
                router();
            });

            test("Should throw a 404 error", async () => {
                mockStore.bills.mockImplementationOnce(() => {
                    return {
                        list: () => {
                            return Promise.reject(new Error("Erreur 404"));
                        },
                    };
                });

                window.onNavigate(ROUTES_PATH.Bills);
                await new Promise(process.nextTick);
                const message = screen.getByText(/Erreur 404/);
                expect(message).toBeTruthy();
            });

            test("fetches messages from an API and fails with 500 message error", async () => {
                mockStore.bills.mockImplementationOnce(() => {
                    return {
                        list: () => {
                            return Promise.reject(new Error("Erreur 500"));
                        },
                    };
                });

                window.onNavigate(ROUTES_PATH.Bills);
                await new Promise(process.nextTick);
                const message = screen.getByText(/Erreur 500/);
                expect(message).toBeTruthy();
            });
        });
    });
});
