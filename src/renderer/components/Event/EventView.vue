/**
* Created by dummy on 4/14/17.
*/
<style scoped>

</style>

<template>
    <f7-view class="view-main" navbar-through tab active :dynamic-navbar="true" main ref="view" @tab:show="onTabShown"
             @tab:hide="onTabHidden">
        <f7-navbar sliding>
            <!--<f7-nav-left v-if="currentEvent">-->
            <!--<f7-link href="/event/edit/">Edit</f7-link>-->
            <!--</f7-nav-left>-->
            <f7-nav-left v-if="displayComplete">
                <f7-link href="#" @click="completeEvent">Complete</f7-link>
            </f7-nav-left>
            <f7-nav-center sliding>{{ computedTitle }}</f7-nav-center>
            <f7-nav-right v-if="currentEvent">
                <f7-link href="/event/check/">{{ currentEvent && isUnlockedEvent(currentEvent) ? 'Check In' : 'ViewRecords'}}
                </f7-link>
            </f7-nav-right>
        </f7-navbar>
        <f7-pages>
            <detail-page></detail-page>
        </f7-pages>
    </f7-view>
</template>

<script>
    import DetailPage from './DetailPage.vue'
    import {EventBusMixin} from '../../mixins/event-bus'
    import {mapGetters} from 'vuex'
    import {EventStatus, LocalEvent} from '../../models/event'

    export default {
        mixins: [EventBusMixin],
        components: {DetailPage},
        data() {
            return {
                sidePanel: true
            }
        },
        computed: {
            router() {
                if (this.$refs['view']) {
                    return this.$refs['view'].f7View.router
                }
                return null
            },
            computedTitle() {
                return this.currentEvent ? this.currentEvent.name : ''
            },
            ...mapGetters([
                'currentEvent',
                'offline'
            ]),
            displayComplete() {
                return this.currentEvent && this.isUnlockedEvent(this.currentEvent) && !(this.currentEvent instanceof LocalEvent) && !this.offline
            }
        },
        methods: {
            isUnlockedEvent(event) {
                return event.status !== EventStatus.COMPLETED
            },
            onTabHidden() {
                this.$publish(this.$channels.EVENT_TAB_SHOW, {status: false})
            },
            routeTo(route, sidePanel) {
                this.routeSidePanel(sidePanel)
                this.router.load({url: route})
            },
            routeSidePanel(route) {
                if (route) {
                    this.sidePanel = true
                    this.$publish(this.$channels.LEFT_VIEW_ROUTE, {url: route})
                    this.$publish(this.$channels.LEFT_VIEW_ENABLE, true)
                } else {
                    this.sidePanel = false
                    this.$publish(this.$channels.LEFT_VIEW_ROUTE, {url: '/left/'})
                    this.$publish(this.$channels.LEFT_VIEW_ENABLE, false)
                }
            },
            onTabShown() {
                this.$publish(this.$channels.EVENT_TAB_SHOW, {status: true})
                this.routeSidePanel('/left/event/')
            },
            completeEvent() {
                const self = this
                const currentEvent = self.currentEvent
                if (currentEvent) {
                    this.$f7.confirm('You may not modify the even once it has been completed.', `Mark event "${currentEvent.name}" as complete?`, () => {
                        self.$store.dispatch('patchEvent', {
                            event: currentEvent,
                            patch: {
                                status: EventStatus.COMPLETED
                            }
                        })
                    })
                }
            }
        },
        watch: {
            router(newVal) {
                if (newVal) {
                    this.setSidePanel()
                }
            },
            'currentEvent.dirty'(newVal) {
                this.$forceUpdate()
            }
        }
    }
</script>

