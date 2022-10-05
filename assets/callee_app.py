from pyteal import *


### Key ###

command = Txn.application_args[0]


def pyteal_lib_test():

    on_creation = Approve()
    on_opt_in = Approve()
    on_close_out = Approve()
    on_update_app = Approve()
    on_delete_app = Approve()
    user_call = Seq(
        Log(Bytes("Called by user")),
    )
    itxn_call = Seq(
        Log(Bytes("Called by Inner Transaction, logging Global.caller_app_id()")),
        Log(Itob(Global.caller_app_id())),
    )
    on_call = Seq(
        Cond(
            [command == Bytes("user_call"), user_call],
            [command == Bytes("itxn_call"), itxn_call],
        ),
        Approve(),
    )

    program = Cond(
        [Txn.application_id() == Int(0), on_creation],
        [Txn.on_completion() == OnComplete.OptIn, on_opt_in],
        [Txn.on_completion() == OnComplete.CloseOut, on_close_out],
        [Txn.on_completion() == OnComplete.UpdateApplication, on_update_app],
        [Txn.on_completion() == OnComplete.DeleteApplication, on_delete_app],
        [Txn.on_completion() == OnComplete.NoOp, on_call],
        # checked picture https://github.com/algorand/docs/blob/92d2bb3929d2301e1d3acfd164b0621593fcac5b/docs/imgs/sccalltypes.png
    )

    return program


if __name__ == "__main__":
    compiled = compileTeal(pyteal_lib_test(), Mode.Application, version=6)
    print(compiled)
