/**
* Created by dummy on 4/14/17.
*/
<style scoped>
    .remove-top-margin {
        margin-top: 0 !important;
    }

    .remove-all-margin {
        margin: 0 !important;
    }
</style>

<template>
    <f7-page name="event-check" @page:init="setPageActive(true)"
             @page:reinit="setPageActive(true)" @page:beforeremove="setPageActive(false)">
        <f7-navbar :title="computedTitle" back-link="Back" sliding>
            <f7-nav-right>
                <f7-link @click="stupidKidForgotHisCard()   " v-if="currentEvent && isUnlockedEvent(currentEvent) ">
                    <f7-icon v-if="remove" f7="delete_round"></f7-icon>
                    <f7-icon v-else f7="add_round"></f7-icon>
                </f7-link>
            </f7-nav-right>
        </f7-navbar>

        <search-bar v-model="filter" @refresh="$refs['virtualscroller'].updateVisibleItems()"
                    @overlayActive="overlayActive = $event"></search-bar>
        <search-bar-overlay :active="overlayActive"></search-bar-overlay>

        <f7-block>
            <f7-grid>
                <f7-col :width="75 + !displayPhoto * 25">
                    <f7-list no-hairlines no-hairlines-between inset class="remove-all-margin">
                        <f7-list-item :title="'Records: ' + amountRecords"></f7-list-item>
                        <f7-list-item :title="'Add: ' + amountAdd"></f7-list-item>
                        <f7-list-item :title="'Remove: ' + amountRemove"></f7-list-item>
                        <li class="media-item" v-if="currentEvent &&  isUnlockedEvent(currentEvent)">
                            <div class="item-content">
                                <div class="item-inner">
                                    <div class="item-title-row">
                                        <div class="item-title">Scan To Remove</div>
                                        <div class="item-after">
                                            <f7-input type="switch" @input="setRemoveValue" :value="remove"></f7-input>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    </f7-list>
                </f7-col>
                <f7-col v-if="displayPhoto" :width="25">
                    <f7-block inset class="remove-all-margin">Reserved</f7-block>
                </f7-col>
            </f7-grid>
        </f7-block>

        <virtual-scroller ref="virtualscroller" v-show="filteredCurrentEventRecords.length > 0" id="check-list"
                          containerTag="ul" mainTag="div"
                          :class="['list-block', 'media-list', 'check-searchbar-found', 'tablet-inset']"
                          :items="filteredCurrentEventRecords" :itemHeight="63" keyField="id">
            <template slot-scope="props">
                <li class="swipeout"
                    :key="props.itemKey">
                    <div class="swipeout-content">
                        <div class="item-content">
                            <div class="item-inner">
                                <div class="item-title-row">
                                    <div class="item-title">{{props.item.student.account.lastName + ', ' +
                                        props.item.student.account.firstName}}
                                    </div>
                                    <div class="item-after">
                                        <span class="badge" style="margin-right: 0.5em"
                                              :class="props.item.signUpTime > 0 ? 'color-green' : 'color-grey'">{{props.item.signUpTime > 0 ? 'Signed Up' : 'Not Signed Up'}}</span>
                                        <span class="badge"
                                              :class="props.item.checkInTime >= 0 ? 'color-blue' : 'color-red'">{{props.item.checkInTime >= 0 ? 'Checked' : 'Removed'}}</span>
                                    </div>
                                </div>
                                <div class="item-subtitle">{{props.item.student.account.preferredName ||
                                    props.item.student.account.firstName}}

                                </div>
                            </div>
                        </div>
                    </div>
                    <!--<div class="swipeout-actions-left" v-if="props.item.checkInTime < 0">-->
                    <!--<a class="swipeout-close swipeout-overswipe bg-blue" href="#">Add</a>-->
                    <!--</div>-->
                    <!--<div class="swipeout-actions-right" v-if="props.item.checkInTime >= 0">-->
                    <!--<a class="swipeout-close swipeout-overswipe bg-red" href="#">Remove</a>-->
                    <!--</div>-->
                    <f7-swipeout-actions right v-if="props.item.checkInTime >= 0 && isUnlockedEvent(currentEvent)">
                        <f7-swipeout-button close overswipe color="red" @click="removeSwiped(props.item.student)">Remove
                        </f7-swipeout-button>
                    </f7-swipeout-actions>
                    <f7-swipeout-actions left v-if="props.item.checkInTime < 0 && isUnlockedEvent(currentEvent)">
                        <f7-swipeout-button close overswipe color="blue" @click="addSwiped(props.item.student)">Add
                        </f7-swipeout-button>
                    </f7-swipeout-actions>
                </li>
            </template>
        </virtual-scroller>

    </f7-page>
</template>

<script>
    import {mapGetters} from 'vuex'
    import {SmartCardController} from 'smartcard'
    import {ActivityEventRecord, EventStatus} from '../../models/event'
    import {EventBusMixin} from '../../mixins/event-bus'
    import SearchBar from '../Master/SearchBar.vue'
    import SearchBarOverlay from '../Master/SearchBarOverlay.vue'
    import moment from 'moment'

    export default {
        mixins: [EventBusMixin],
        components: {SearchBar, SearchBarOverlay},
        data() {
            return {
                smart: null,
                errorCallbackUnsubscriber: null,
                connectCallbackUnsubscriber: null,
                pageActive: false,
                subscription: null,
                displayPhoto: false,
                filter: '',
                overlayActive: false,
                remove: false,
                activeSubscription: null
            }
        },
        computed: {
            ...mapGetters([
                'currentEvent',
                'sortedCurrentEventRecords',
                'cardSecretStudentMap'
            ]),
            computedTitle() {
                return this.currentEvent ? this.currentEvent.name : ''
            },
            checkable() {
                return this.currentEvent ? this.isUnlockedEvent(this.currentEvent) : false
            },
            amountRecords() {
                return this.sortedCurrentEventRecords.length
            },
            amountAdd() {
                return this.sortedCurrentEventRecords.reduce((acc, val) => {
                    return val.checkInTime >= 0 ? ++acc : acc
                }, 0)
            },
            amountRemove() {
                return this.sortedCurrentEventRecords.reduce((acc, val) => {
                    return val.checkInTime < 0 ? ++acc : acc
                }, 0)
            },
            filteredCurrentEventRecords() {
                const filter = this.filter
                // console.log(this.sortedCurrentEventRecords)
                return this.filter === '' ? this.sortedCurrentEventRecords : this.sortedCurrentEventRecords.filter((record) => {
                    const student = record.student
                    const fullName = (student.account.firstName + ' ' + student.account.lastName + ' ' + student.account.preferredName).toLowerCase()
                    return fullName.includes(filter)
                })
            }
        },
        methods: {
            setRemoveValue(event) {
                this.remove = event
            },
            isUnlockedEvent(event) {
                return event.status !== EventStatus.COMPLETED
            },
            setPageActive(active) {
                this.pageActive = active
            },
            removeSwiped(student) {
                if (this.checkable) {
                    this.$store.dispatch('addEventRecord', {
                        record: new ActivityEventRecord({
                            student: student,
                            signUpTime: this.getStudentSignUpTime(student),
                            checkInTime: -(moment().unix())
                        })
                    })
                    this.$forceUpdate()
                }
            },
            addSwiped(student) {
                if (this.checkable) {
                    this.$store.dispatch('addEventRecord', {
                        record: new ActivityEventRecord({
                            student: student,
                            signUpTime: this.getStudentSignUpTime(student),
                            checkInTime: moment().unix()
                        })
                    })
                    this.$forceUpdate()
                }
            },
            addRecord(cardSecret) {
                if (this.checkable) {
                    const toRemove = this.remove ? -1 : 1
                    const cardSecretStudentMap = this.cardSecretStudentMap
                    const foundStudent = cardSecretStudentMap[cardSecret.toLowerCase()] ||
                        cardSecretStudentMap[cardSecret.toUpperCase()]
                    if (foundStudent && this.currentEvent) {
                        this.$store.dispatch('addEventRecord', {
                            record: new ActivityEventRecord({
                                student: foundStudent,
                                signUpTime: this.getStudentSignUpTime(foundStudent),
                                checkInTime: toRemove * moment().unix()
                            })
                        })
                        this.$forceUpdate()
                    } else {
                        if (!this.subscription) {
                            this.$publish(this.$channels.SELECT_STUDENT_POPUP)
                            const self = this
                            this.subscription = this.$subscribe(this.$channels.SELECTED_STUDENT, ({student}) => {
                                self.$unsubscribe(self.subscription)
                                self.subscription = null
                                if (student) {
                                    self.$store.dispatch('addEventRecord', {
                                        record: new ActivityEventRecord({
                                            student: student,
                                            signUpTime: self.getStudentSignUpTime(student),
                                            checkInTime: toRemove * moment().unix()
                                        })
                                    })
                                    self.$store.dispatch('patchStudentCardSecret', {
                                        student, cardSecret
                                    })
                                    self.$forceUpdate()
                                }
                            })
                        }
                    }
                }
            },
            stupidKidForgotHisCard() {
                if (this.checkable) {
                    if (!this.subscription) {
                        const toRemove = this.remove ? -1 : 1
                        this.$publish(this.$channels.SELECT_STUDENT_POPUP)
                        const self = this
                        this.subscription = this.$subscribe(this.$channels.SELECTED_STUDENT, ({student}) => {
                            self.$unsubscribe(self.subscription)
                            self.subscription = null
                            if (student) {
                                self.$store.dispatch('addEventRecord', {
                                    record: new ActivityEventRecord({
                                        student: student,
                                        signUpTime: self.getStudentSignUpTime(student),
                                        checkInTime: toRemove * moment().unix()
                                    })
                                })
                                self.$forceUpdate()
                            }
                        })
                    }
                }
            },
            getStudentSignUpTime(student) {
                let filteredRecords = this.sortedCurrentEventRecords.filter(e => {
                    return student.idNumber === e.student.idNumber
                })
                console.log('filteredRecords', filteredRecords)
                return filteredRecords.length >= 1 ? filteredRecords[0].signUpTime : -1
            }
        },
        created() {
            const self = this
            this.smart = new SmartCardController()
            this.errorCallbackUnsubscriber = this.smart.onError((error) => {
                console.log(error)
            })
            this.connectCallbackUnsubscriber = this.smart.onConnect((reader) => {
                reader.onInsert((card) => {
                    if (card) {
                        if (card.atr) {
                            if (self.pageActive && self.currentEvent && self.isUnlockedEvent(self.currentEvent)) {
                                self.addRecord(card.atr)
                            }
                        } else {
                            console.warn('card.atr=', card.atr)
                        }
                    } else {
                        console.warn('card=', card)
                    }
                })
                reader.onError((error) => {
                    console.log(error)
                })
            })
            this.activeSubscription = this.$subscribe(this.$channels.EVENT_TAB_SHOW, ({status}) => {
                self.setPageActive(status)
            })
        },
        beforeDestroy() {
            if (this.smart) {
                this.smart.close()
            }
            if (this.errorCallbackUnsubscriber) {
                this.errorCallbackUnsubscriber()
            }
            if (this.connectCallbackUnsubscriber) {
                this.connectCallbackUnsubscriber()
            }
            if (this.activeSubscription) {
                this.$unsubscribe(this.activeSubscription)
            }
        }
    }
</script>

